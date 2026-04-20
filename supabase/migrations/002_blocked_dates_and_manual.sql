-- =============================================================
-- Migration 002: blocked dates + admin manual booking
-- =============================================================

-- -------------------------------------------------------------
-- Blocked dates table
-- -------------------------------------------------------------
create table if not exists blocked_dates (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  product_id uuid references products(id) on delete cascade, -- null = blocks all castles
  start_date date not null,
  end_date date not null,
  reason text,
  created_at timestamptz default now(),
  check (end_date >= start_date)
);

create index if not exists idx_blocked_dates_business on blocked_dates(business_id);
create index if not exists idx_blocked_dates_product  on blocked_dates(product_id);
create index if not exists idx_blocked_dates_dates    on blocked_dates(start_date, end_date);

alter table blocked_dates enable row level security;

drop policy if exists "Owner can manage blocked dates" on blocked_dates;
create policy "Owner can manage blocked dates"
  on blocked_dates for all
  using (auth.uid() = business_id)
  with check (auth.uid() = business_id);

-- -------------------------------------------------------------
-- Updated availability function: also checks blocked_dates
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
  total_qty     integer;
  booked_qty    integer;
  v_business    uuid;
  blocked_count integer;
begin
  select quantity_available, business_id
    into total_qty, v_business
  from products where id = p_product_id;

  if total_qty is null then
    return 0;
  end if;

  -- Any block (for this castle OR all castles) overlapping the dates makes it 0
  select count(*) into blocked_count
  from blocked_dates
  where business_id = v_business
    and (product_id is null or product_id = p_product_id)
    and start_date <= p_end_date
    and end_date   >= p_start_date;

  if blocked_count > 0 then
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

-- -------------------------------------------------------------
-- Admin manual booking - bypasses availability checks
-- (Used when admin enters a phoned-in booking)
-- -------------------------------------------------------------
create or replace function public.admin_create_booking(
  p_business_id   uuid,
  p_product_id    uuid,
  p_customer_name text,
  p_email         text,
  p_phone         text,
  p_address       text,
  p_start_date    date,
  p_end_date      date,
  p_status        text default 'confirmed'
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
  if auth.uid() is null or auth.uid() <> p_business_id then
    raise exception 'not authorized';
  end if;

  if p_end_date < p_start_date then
    raise exception 'end_date must be on or after start_date';
  end if;

  if p_status not in ('pending','confirmed','completed','cancelled') then
    raise exception 'invalid status';
  end if;

  select * into v_product
  from products
  where id = p_product_id and business_id = p_business_id;

  if not found then
    raise exception 'castle not found';
  end if;

  v_days  := (p_end_date - p_start_date) + 1;
  v_total := (v_product.price_per_day * v_days) + coalesce(v_product.delivery_fee, 0);

  insert into bookings (
    business_id, product_id, customer_name, email, phone, address,
    start_date, end_date, status, total_price
  ) values (
    p_business_id, p_product_id, p_customer_name, p_email, p_phone, p_address,
    p_start_date, p_end_date, p_status, v_total
  )
  returning * into v_booking;

  return v_booking;
end;
$$;

grant execute on function public.admin_create_booking(uuid, uuid, text, text, text, text, date, date, text) to authenticated;
