-- =============================================================
-- Rental Booking System - initial schema
-- =============================================================
create extension if not exists "uuid-ossp";

-- -------------------------------------------------------------
-- Tables
-- -------------------------------------------------------------
create table if not exists businesses (
  id uuid primary key,                       -- = auth.users.id
  name text not null,
  email text not null unique,
  phone text,
  address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  description text,
  price_per_day numeric(10,2) not null check (price_per_day >= 0),
  image_url text,
  quantity_available integer not null default 1 check (quantity_available >= 0),
  delivery_fee numeric(10,2) default 0 check (delivery_fee >= 0),
  setup_time_buffer integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists bookings (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  customer_name text not null,
  email text not null,
  phone text not null,
  address text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'pending'
    check (status in ('pending','confirmed','completed','cancelled')),
  total_price numeric(10,2) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (end_date >= start_date)
);

-- -------------------------------------------------------------
-- Indexes
-- -------------------------------------------------------------
create index if not exists idx_products_business_id on products(business_id);
create index if not exists idx_bookings_business_id on bookings(business_id);
create index if not exists idx_bookings_product_id  on bookings(product_id);
create index if not exists idx_bookings_dates       on bookings(start_date, end_date);
create index if not exists idx_bookings_status      on bookings(status);

-- -------------------------------------------------------------
-- Auto-create a business row when a new auth user signs up
-- -------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.businesses (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'business_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------------------------------------------
-- Availability functions
-- -------------------------------------------------------------
create or replace function public.get_available_quantity(
  p_product_id uuid,
  p_start_date date,
  p_end_date   date
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  total_qty  integer;
  booked_qty integer;
begin
  select quantity_available into total_qty
  from products where id = p_product_id;

  if total_qty is null then
    return 0;
  end if;

  select count(*) into booked_qty
  from bookings
  where product_id = p_product_id
    and status in ('pending','confirmed')
    and start_date <= p_end_date
    and end_date   >= p_start_date;

  return greatest(total_qty - booked_qty, 0);
end;
$$;

create or replace function public.is_booking_available(
  p_product_id uuid,
  p_start_date date,
  p_end_date   date
) returns boolean
language sql
security definer
set search_path = public
as $$
  select public.get_available_quantity(p_product_id, p_start_date, p_end_date) > 0;
$$;

-- Atomic create booking - validates availability inside the transaction
-- so two concurrent inserts cannot oversell stock.
create or replace function public.create_booking_atomic(
  p_business_id   uuid,
  p_product_id    uuid,
  p_customer_name text,
  p_email         text,
  p_phone         text,
  p_address       text,
  p_start_date    date,
  p_end_date      date
) returns bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product products%rowtype;
  v_days    integer;
  v_total   numeric(10,2);
  v_booking bookings%rowtype;
begin
  if p_end_date < p_start_date then
    raise exception 'end_date must be on or after start_date';
  end if;

  select * into v_product
  from products
  where id = p_product_id and business_id = p_business_id
  for update;

  if not found then
    raise exception 'product not found';
  end if;

  perform 1 from bookings
   where product_id = p_product_id
     and status in ('pending','confirmed')
     and start_date <= p_end_date
     and end_date   >= p_start_date
   for update;

  if get_available_quantity(p_product_id, p_start_date, p_end_date) <= 0 then
    raise exception 'product not available for selected dates';
  end if;

  v_days  := (p_end_date - p_start_date) + 1;
  v_total := (v_product.price_per_day * v_days) + coalesce(v_product.delivery_fee, 0);

  insert into bookings (
    business_id, product_id, customer_name, email, phone, address,
    start_date, end_date, status, total_price
  ) values (
    p_business_id, p_product_id, p_customer_name, p_email, p_phone, p_address,
    p_start_date, p_end_date, 'pending', v_total
  )
  returning * into v_booking;

  return v_booking;
end;
$$;

-- -------------------------------------------------------------
-- Row Level Security
-- -------------------------------------------------------------
alter table businesses enable row level security;
alter table products   enable row level security;
alter table bookings   enable row level security;

drop policy if exists "Owner can view own business"   on businesses;
drop policy if exists "Owner can update own business" on businesses;
create policy "Owner can view own business"
  on businesses for select using (auth.uid() = id);
create policy "Owner can update own business"
  on businesses for update using (auth.uid() = id);

drop policy if exists "Owner can view own products"   on products;
drop policy if exists "Owner can insert own products" on products;
drop policy if exists "Owner can update own products" on products;
drop policy if exists "Owner can delete own products" on products;
drop policy if exists "Public can view products"      on products;
create policy "Owner can view own products"
  on products for select using (auth.uid() = business_id);
create policy "Owner can insert own products"
  on products for insert with check (auth.uid() = business_id);
create policy "Owner can update own products"
  on products for update using (auth.uid() = business_id);
create policy "Owner can delete own products"
  on products for delete using (auth.uid() = business_id);
create policy "Public can view products"
  on products for select using (true);

drop policy if exists "Owner can view own bookings"   on bookings;
drop policy if exists "Owner can update own bookings" on bookings;
drop policy if exists "Owner can delete own bookings" on bookings;
create policy "Owner can view own bookings"
  on bookings for select using (auth.uid() = business_id);
create policy "Owner can update own bookings"
  on bookings for update using (auth.uid() = business_id);
create policy "Owner can delete own bookings"
  on bookings for delete using (auth.uid() = business_id);

grant execute on function public.get_available_quantity(uuid, date, date) to anon, authenticated;
grant execute on function public.is_booking_available(uuid, date, date)   to anon, authenticated;
grant execute on function public.create_booking_atomic(uuid, uuid, text, text, text, text, date, date) to anon, authenticated;
