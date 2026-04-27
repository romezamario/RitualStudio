-- Tabla products para catálogo administrable desde /admin/productos

create table if not exists public.products (
  slug text primary key,
  name text not null,
  category text not null,
  price text not null,
  image text not null,
  short_description text not null,
  description text not null,
  size text not null,
  flowers text[] not null default '{}'::text[],
  ideal_for text[] not null default '{}'::text[],
  delivery text not null,
  original_price text,
  has_offer boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_name_idx on public.products(name);
create index if not exists products_category_idx on public.products(category);

alter table public.products enable row level security;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

drop policy if exists "Products public read" on public.products;
create policy "Products public read"
on public.products
for select
to anon, authenticated
using (true);

drop policy if exists "Products admin write" on public.products;
create policy "Products admin write"
on public.products
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
