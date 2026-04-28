create or replace function public.reserve_course_capacity_for_order(
  p_order_id uuid,
  p_course_items jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  v_course_id uuid;
  v_course_session_id uuid;
  v_quantity int;
  v_unit_price numeric(12,2);
  v_subtotal numeric(12,2);
  v_participants jsonb;
  v_item_course_id uuid;
  v_session_course_id uuid;
  v_session_capacity int;
  v_session_reserved int;
  v_order_course_item_id uuid;
  v_name text;
begin
  if p_order_id is null then
    raise exception 'Orden inválida para reservar cupos.';
  end if;

  if p_course_items is null or jsonb_typeof(p_course_items) <> 'array' then
    raise exception 'Items de curso inválidos para reserva.';
  end if;

  for item in select value from jsonb_array_elements(p_course_items)
  loop
    v_course_id := nullif(item->>'course_id', '')::uuid;
    v_course_session_id := nullif(item->>'course_session_id', '')::uuid;
    v_quantity := coalesce((item->>'quantity')::int, 0);
    v_unit_price := coalesce((item->>'unit_price')::numeric, 0);
    v_subtotal := coalesce((item->>'subtotal')::numeric, 0);
    v_participants := coalesce(item->'participants', '[]'::jsonb);

    if v_course_id is null or v_course_session_id is null then
      raise exception 'Item de curso inválido: faltan IDs de curso/sesión.';
    end if;

    if v_quantity < 1 then
      raise exception 'Item de curso inválido: quantity debe ser >= 1.';
    end if;

    if jsonb_array_length(v_participants) <> v_quantity then
      raise exception 'Participantes inválidos: cantidad no coincide con quantity.';
    end if;

    select c.id
    into v_item_course_id
    from public.courses c
    where c.id = v_course_id
      and c.is_active = true
    limit 1;

    if v_item_course_id is null then
      raise exception 'Curso inactivo o inexistente en reserva de cupo.';
    end if;

    select cs.course_id, cs.capacity, cs.reserved_spots
    into v_session_course_id, v_session_capacity, v_session_reserved
    from public.course_sessions cs
    where cs.id = v_course_session_id
      and cs.is_active = true
    for update;

    if v_session_course_id is null then
      raise exception 'Sesión inactiva o inexistente en reserva de cupo.';
    end if;

    if v_session_course_id <> v_item_course_id then
      raise exception 'Sesión y curso no coinciden en reserva de cupo.';
    end if;

    if (v_session_capacity - v_session_reserved) < v_quantity then
      raise exception 'Cupo insuficiente para la sesión seleccionada.';
    end if;

    update public.course_sessions
    set reserved_spots = reserved_spots + v_quantity
    where id = v_course_session_id;

    insert into public.order_course_items (
      order_id,
      course_id,
      course_session_id,
      quantity,
      unit_price,
      subtotal,
      metadata
    )
    values (
      p_order_id,
      v_course_id,
      v_course_session_id,
      v_quantity,
      v_unit_price,
      v_subtotal,
      jsonb_build_object(
        'source', 'checkout-bricks-card-payment',
        'capacity_released', false
      )
    )
    returning id into v_order_course_item_id;

    for v_name in select jsonb_array_elements_text(v_participants)
    loop
      insert into public.course_participants (order_course_item_id, full_name)
      values (v_order_course_item_id, trim(v_name));
    end loop;
  end loop;
end;
$$;

create or replace function public.release_course_capacity_for_order(
  p_order_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  line record;
  v_release_reason text;
begin
  if p_order_id is null then
    return;
  end if;

  v_release_reason := coalesce(nullif(trim(p_reason), ''), 'payment-not-approved');

  for line in
    select oci.id, oci.course_session_id, oci.quantity
    from public.order_course_items oci
    where oci.order_id = p_order_id
      and coalesce((oci.metadata->>'capacity_released')::boolean, false) = false
  loop
    update public.course_sessions cs
    set reserved_spots = greatest(cs.reserved_spots - line.quantity, 0)
    where cs.id = line.course_session_id;

    update public.order_course_items oci
    set metadata = jsonb_set(
      jsonb_set(coalesce(oci.metadata, '{}'::jsonb), '{capacity_released}', 'true'::jsonb, true),
      '{capacity_released_reason}',
      to_jsonb(v_release_reason),
      true
    )
    where oci.id = line.id;
  end loop;
end;
$$;

revoke all on function public.reserve_course_capacity_for_order(uuid, jsonb) from public;
revoke all on function public.release_course_capacity_for_order(uuid, text) from public;
grant execute on function public.reserve_course_capacity_for_order(uuid, jsonb) to service_role;
grant execute on function public.release_course_capacity_for_order(uuid, text) to service_role;
