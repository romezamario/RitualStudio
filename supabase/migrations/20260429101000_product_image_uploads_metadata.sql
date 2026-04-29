create table if not exists public.product_image_uploads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  product_slug text,
  product_id text,
  admin_user_id uuid,
  width integer,
  height integer,
  size_bytes bigint not null check (size_bytes > 0),
  mime_type text not null,
  original_filename text not null,
  storage_path text not null
);

alter table public.product_image_uploads enable row level security;

drop policy if exists "Product image uploads admin read" on public.product_image_uploads;
create policy "Product image uploads admin read"
on public.product_image_uploads
for select
to authenticated
using (public.is_admin());

drop policy if exists "Product image uploads admin insert" on public.product_image_uploads;
create policy "Product image uploads admin insert"
on public.product_image_uploads
for insert
to authenticated
with check (public.is_admin());
