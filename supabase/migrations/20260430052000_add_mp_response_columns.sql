alter table if exists public.orders
  add column if not exists raw_response jsonb;

alter table if exists public.payments
  add column if not exists payment_method_type text;
