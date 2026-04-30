alter table public.payment_events
add column if not exists event_key text;

update public.payment_events
set event_key = concat_ws(':', coalesce(type, 'unknown'), coalesce(mercado_pago_event_id, 'na'), coalesce(action, 'na'))
where event_key is null;

alter table public.payment_events
alter column event_key set not null;

create unique index if not exists payment_events_event_key_key
on public.payment_events(event_key);
