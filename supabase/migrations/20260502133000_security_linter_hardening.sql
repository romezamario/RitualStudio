-- Supabase linter hardening: fixed search_path, RPC execute grants, and public bucket listing.

-- 1) Ensure trigger functions use fixed search_path.
alter function public.set_updated_at() set search_path = public;
alter function public.set_updated_at_timestamp() set search_path = public;

-- 2) Restrict SECURITY DEFINER function execution to intended roles only.
-- Remove default/public execute grants from exposed roles.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.reserve_course_capacity_for_order(uuid, jsonb) from anon, authenticated;
revoke all on function public.release_course_capacity_for_order(uuid, text) from anon, authenticated;

-- Restore only required grants.
grant execute on function public.is_admin() to authenticated;
grant execute on function public.reserve_course_capacity_for_order(uuid, jsonb) to service_role;
grant execute on function public.release_course_capacity_for_order(uuid, text) to service_role;

-- 3) Public bucket objects are already accessible by URL; remove broad list policy.
drop policy if exists "Product images public read" on storage.objects;
