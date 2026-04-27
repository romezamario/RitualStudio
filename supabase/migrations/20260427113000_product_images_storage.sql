-- Bucket dedicado para imágenes de catálogo de productos

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update
set public = excluded.public,
    name = excluded.name;

-- Lectura pública para servir imágenes por URL pública.
drop policy if exists "Product images public read" on storage.objects;
create policy "Product images public read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'product-images');

-- Escritura restringida a cuentas admin autenticadas.
drop policy if exists "Product images admin insert" on storage.objects;
create policy "Product images admin insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Product images admin update" on storage.objects;
create policy "Product images admin update"
on storage.objects
for update
to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Product images admin delete" on storage.objects;
create policy "Product images admin delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'product-images' and public.is_admin());
