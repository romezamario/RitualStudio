-- Bucket dedicado para imágenes de catálogo administradas desde /admin/productos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Lectura pública para catálogo (alternativa: bucket privado + signed URLs)
drop policy if exists "Product images public read" on storage.objects;
create policy "Product images public read"
on storage.objects
for select
to public
using (bucket_id = 'product-images');

-- Escritura solo por backend autenticado con service role (no directa desde cliente)
drop policy if exists "Product images admin write" on storage.objects;
create policy "Product images admin write"
on storage.objects
for all
to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());
