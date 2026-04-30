-- Extiende perfiles con datos de contacto y ajusta política de update sin escalación de rol

alter table public.profiles
  add column if not exists full_name text null,
  add column if not exists phone text null;

-- Reforzamos la política de update para que usuarios autenticados
-- solo editen su propio perfil y no puedan escalar role.
drop policy if exists "Users can update own profile without role escalation" on public.profiles;
create policy "Users can update own profile without role escalation"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (
  auth.uid() = id
  and (
    role = (select p.role from public.profiles p where p.id = auth.uid())
    or public.is_admin()
  )
);
