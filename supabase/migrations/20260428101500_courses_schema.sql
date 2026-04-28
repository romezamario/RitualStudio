create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  price numeric(12,2) not null,
  is_active boolean not null default true,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz,
  capacity int not null,
  reserved_spots int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_sessions_capacity_check check (capacity > 0),
  constraint course_sessions_reserved_spots_check check (reserved_spots >= 0),
  constraint course_sessions_ends_after_start_check check (ends_at is null or ends_at > starts_at)
);

create table if not exists public.order_course_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  course_id uuid not null references public.courses(id),
  course_session_id uuid not null references public.course_sessions(id),
  quantity int not null,
  unit_price numeric(12,2) not null,
  subtotal numeric(12,2) not null,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint order_course_items_quantity_check check (quantity >= 1)
);

create table if not exists public.course_participants (
  id uuid primary key default gen_random_uuid(),
  order_course_item_id uuid not null references public.order_course_items(id) on delete cascade,
  full_name text not null,
  email text,
  created_at timestamptz not null default now()
);

create index if not exists idx_course_sessions_course_id on public.course_sessions(course_id);
create index if not exists idx_course_sessions_starts_at on public.course_sessions(starts_at);
create index if not exists idx_order_course_items_course_id on public.order_course_items(course_id);
create index if not exists idx_order_course_items_course_session_id on public.order_course_items(course_session_id);

alter table public.courses enable row level security;
alter table public.course_sessions enable row level security;
alter table public.order_course_items enable row level security;
alter table public.course_participants enable row level security;

drop trigger if exists courses_set_updated_at on public.courses;
create trigger courses_set_updated_at
before update on public.courses
for each row
execute function public.set_updated_at();

drop trigger if exists course_sessions_set_updated_at on public.course_sessions;
create trigger course_sessions_set_updated_at
before update on public.course_sessions
for each row
execute function public.set_updated_at();

drop trigger if exists order_course_items_set_updated_at on public.order_course_items;
create trigger order_course_items_set_updated_at
before update on public.order_course_items
for each row
execute function public.set_updated_at();

drop policy if exists "Courses public read active" on public.courses;
create policy "Courses public read active"
on public.courses
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Courses admin write" on public.courses;
create policy "Courses admin write"
on public.courses
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Course sessions public read active" on public.course_sessions;
create policy "Course sessions public read active"
on public.course_sessions
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.courses c
    where c.id = course_sessions.course_id
      and c.is_active = true
  )
);

drop policy if exists "Course sessions admin write" on public.course_sessions;
create policy "Course sessions admin write"
on public.course_sessions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can read own order course items" on public.order_course_items;
create policy "Users can read own order course items"
on public.order_course_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_course_items.order_id
      and o.user_id = auth.uid()
  )
);

drop policy if exists "Admins can manage order course items" on public.order_course_items;
create policy "Admins can manage order course items"
on public.order_course_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can read own course participants" on public.course_participants;
create policy "Users can read own course participants"
on public.course_participants
for select
to authenticated
using (
  exists (
    select 1
    from public.order_course_items oci
    join public.orders o on o.id = oci.order_id
    where oci.id = course_participants.order_course_item_id
      and o.user_id = auth.uid()
  )
);

drop policy if exists "Admins can manage course participants" on public.course_participants;
create policy "Admins can manage course participants"
on public.course_participants
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
