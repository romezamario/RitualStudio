create table if not exists public.order_claim_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  claimed_by_user_id uuid not null references auth.users(id) on delete restrict,
  claim_method text not null,
  customer_email text not null,
  claim_reference text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.order_claim_events enable row level security;

grant select, insert on public.order_claim_events to service_role;
grant select on public.order_claim_events to authenticated;

create policy "Order claim events admin read"
on public.order_claim_events
for select
to authenticated
using (public.is_admin());
