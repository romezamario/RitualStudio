alter table public.app_settings enable row level security;

revoke all on table public.app_settings from anon, authenticated;

drop policy if exists app_settings_read_public on public.app_settings;
drop policy if exists app_settings_write_admin on public.app_settings;

create policy app_settings_read_public
on public.app_settings
for select
to anon, authenticated
using (key = 'payments_mode');

create policy app_settings_write_admin
on public.app_settings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
