alter table public.courses
  add column if not exists original_price numeric(12,2),
  add column if not exists has_offer boolean not null default false;

alter table public.courses
  add constraint courses_offer_price_check
  check (
    (has_offer = false and original_price is null)
    or (has_offer = true and original_price is not null and original_price > price)
  );
