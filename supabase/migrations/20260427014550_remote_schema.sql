drop extension if exists "pg_net";


  create table "public"."orders" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "external_reference" text not null,
    "mercado_pago_order_id" text,
    "mercado_pago_client_token" text,
    "status" text default 'created'::text,
    "total_amount" numeric(12,2) not null,
    "currency" text default 'MXN'::text,
    "customer_email" text,
    "metadata" jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."orders" enable row level security;


  create table "public"."payment_events" (
    "id" uuid not null default gen_random_uuid(),
    "mercado_pago_event_id" text,
    "type" text,
    "action" text,
    "order_id" uuid,
    "payload" jsonb not null,
    "received_at" timestamp with time zone default now()
      );


alter table "public"."payment_events" enable row level security;


  create table "public"."payments" (
    "id" uuid not null default gen_random_uuid(),
    "order_id" uuid,
    "mercado_pago_payment_id" text,
    "mercado_pago_order_id" text,
    "status" text,
    "status_detail" text,
    "payment_method" text,
    "amount" numeric(12,2),
    "raw_response" jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."payments" enable row level security;

CREATE UNIQUE INDEX orders_external_reference_key ON public.orders USING btree (external_reference);

CREATE UNIQUE INDEX orders_pkey ON public.orders USING btree (id);

CREATE UNIQUE INDEX payment_events_pkey ON public.payment_events USING btree (id);

CREATE UNIQUE INDEX payments_pkey ON public.payments USING btree (id);

alter table "public"."orders" add constraint "orders_pkey" PRIMARY KEY using index "orders_pkey";

alter table "public"."payment_events" add constraint "payment_events_pkey" PRIMARY KEY using index "payment_events_pkey";

alter table "public"."payments" add constraint "payments_pkey" PRIMARY KEY using index "payments_pkey";

alter table "public"."orders" add constraint "orders_external_reference_key" UNIQUE using index "orders_external_reference_key";

alter table "public"."orders" add constraint "orders_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."orders" validate constraint "orders_user_id_fkey";

alter table "public"."payment_events" add constraint "payment_events_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) not valid;

alter table "public"."payment_events" validate constraint "payment_events_order_id_fkey";

alter table "public"."payments" add constraint "payments_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE not valid;

alter table "public"."payments" validate constraint "payments_order_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

grant delete on table "public"."orders" to "anon";

grant insert on table "public"."orders" to "anon";

grant references on table "public"."orders" to "anon";

grant select on table "public"."orders" to "anon";

grant trigger on table "public"."orders" to "anon";

grant truncate on table "public"."orders" to "anon";

grant update on table "public"."orders" to "anon";

grant delete on table "public"."orders" to "authenticated";

grant insert on table "public"."orders" to "authenticated";

grant references on table "public"."orders" to "authenticated";

grant select on table "public"."orders" to "authenticated";

grant trigger on table "public"."orders" to "authenticated";

grant truncate on table "public"."orders" to "authenticated";

grant update on table "public"."orders" to "authenticated";

grant delete on table "public"."orders" to "service_role";

grant insert on table "public"."orders" to "service_role";

grant references on table "public"."orders" to "service_role";

grant select on table "public"."orders" to "service_role";

grant trigger on table "public"."orders" to "service_role";

grant truncate on table "public"."orders" to "service_role";

grant update on table "public"."orders" to "service_role";

grant delete on table "public"."payment_events" to "anon";

grant insert on table "public"."payment_events" to "anon";

grant references on table "public"."payment_events" to "anon";

grant select on table "public"."payment_events" to "anon";

grant trigger on table "public"."payment_events" to "anon";

grant truncate on table "public"."payment_events" to "anon";

grant update on table "public"."payment_events" to "anon";

grant delete on table "public"."payment_events" to "authenticated";

grant insert on table "public"."payment_events" to "authenticated";

grant references on table "public"."payment_events" to "authenticated";

grant select on table "public"."payment_events" to "authenticated";

grant trigger on table "public"."payment_events" to "authenticated";

grant truncate on table "public"."payment_events" to "authenticated";

grant update on table "public"."payment_events" to "authenticated";

grant delete on table "public"."payment_events" to "service_role";

grant insert on table "public"."payment_events" to "service_role";

grant references on table "public"."payment_events" to "service_role";

grant select on table "public"."payment_events" to "service_role";

grant trigger on table "public"."payment_events" to "service_role";

grant truncate on table "public"."payment_events" to "service_role";

grant update on table "public"."payment_events" to "service_role";

grant delete on table "public"."payments" to "anon";

grant insert on table "public"."payments" to "anon";

grant references on table "public"."payments" to "anon";

grant select on table "public"."payments" to "anon";

grant trigger on table "public"."payments" to "anon";

grant truncate on table "public"."payments" to "anon";

grant update on table "public"."payments" to "anon";

grant delete on table "public"."payments" to "authenticated";

grant insert on table "public"."payments" to "authenticated";

grant references on table "public"."payments" to "authenticated";

grant select on table "public"."payments" to "authenticated";

grant trigger on table "public"."payments" to "authenticated";

grant truncate on table "public"."payments" to "authenticated";

grant update on table "public"."payments" to "authenticated";

grant delete on table "public"."payments" to "service_role";

grant insert on table "public"."payments" to "service_role";

grant references on table "public"."payments" to "service_role";

grant select on table "public"."payments" to "service_role";

grant trigger on table "public"."payments" to "service_role";

grant truncate on table "public"."payments" to "service_role";

grant update on table "public"."payments" to "service_role";


  create policy "Orders admin write"
  on "public"."orders"
  as permissive
  for all
  to authenticated
using (public.is_admin())
with check (public.is_admin());



  create policy "Users can view their own orders"
  on "public"."orders"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "Users can view payments for their own orders"
  on "public"."payments"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.orders
  WHERE ((orders.id = payments.order_id) AND (orders.user_id = auth.uid())))));



