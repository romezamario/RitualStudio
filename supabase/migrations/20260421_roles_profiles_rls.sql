-- Roles y perfiles para control de acceso con RLS en Supabase

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

-- Políticas base para perfiles

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can update own profile without role escalation" on public.profiles;
create policy "Users can update own profile without role escalation"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (
  auth.uid() = id
  and (
    (select role from public.profiles where id = auth.uid()) = role
    or public.is_admin()
  )
);

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
on public.profiles
for select
to authenticated
using (public.is_admin());

-- Opcional: permitir que admins actualicen cualquier perfil (incluyendo rol).
drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Infraestructura de ejemplo para tablas administrativas (aplicar cuando existan).
-- Este bloque no falla si las tablas aún no existen.
do $$
begin
  if to_regclass('public.orders') is not null then
    execute 'alter table public.orders enable row level security';
    execute 'drop policy if exists "Orders admin write" on public.orders';
    execute 'create policy "Orders admin write" on public.orders for all to authenticated using (public.is_admin()) with check (public.is_admin())';
  end if;

  if to_regclass('public.products') is not null then
    execute 'alter table public.products enable row level security';
    execute 'drop policy if exists "Products admin write" on public.products';
    execute 'create policy "Products admin write" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin())';
  end if;
end
$$;

-- Promoción manual del primer admin (ejecutar solo por operador autorizado):
-- update public.profiles set role = 'admin' where email = 'correo@dominio.com';
