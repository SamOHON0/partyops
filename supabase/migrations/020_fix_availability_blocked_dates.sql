-- Migration 020: Fix two availability regressions introduced by migration 017
--
-- BUG 1 (critical): Migration 017 redefined get_available_quantity and silently
-- DROPPED the blocked_dates check that migration 002 added. Since 017 shipped,
-- blocked dates have not blocked anything: customers could book dates the
-- operator explicitly blocked out. This restores the blocked_dates check.
--
-- BUG 2 (high): 017's "release stale pending after 30 minutes" applied to ALL
-- businesses. That is correct for payment-required businesses (an unpaid pending
-- booking is an abandoned checkout), but wrong for request-flow businesses,
-- where every legitimate booking sits in 'pending' until the operator confirms
-- it manually. For those, the slot reopened after 30 minutes and the same dates
-- could be double-booked. Pending bookings now only expire when the business
-- has payment_required = true.

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
  v_pay_req     boolean;
  blocked_count integer;
begin
  select p.quantity_available, p.business_id
    into total_qty, v_business
  from products p where p.id = p_product_id;

  if total_qty is null then
    return 0;
  end if;

  -- Restored from migration 002: any block (for this product OR all products)
  -- overlapping the dates makes availability 0.
  select count(*) into blocked_count
  from blocked_dates
  where business_id = v_business
    and (product_id is null or product_id = p_product_id)
    and start_date <= p_end_date
    and end_date   >= p_start_date;

  if blocked_count > 0 then
    return 0;
  end if;

  select coalesce(b.payment_required, false)
    into v_pay_req
  from businesses b where b.id = v_business;

  select count(*) into booked_qty
  from bookings
  where product_id = p_product_id
    and start_date <= p_end_date
    and end_date   >= p_start_date
    and (
      status = 'confirmed'
      or (
        status = 'pending'
        and (
          -- Request-flow businesses: pending bookings hold the slot until the
          -- operator confirms or cancels (pre-017 behaviour).
          not v_pay_req
          -- Payment-required businesses: unpaid pending bookings are abandoned
          -- checkouts; release the slot after 30 minutes.
          or created_at > now() - interval '30 minutes'
        )
      )
    );

  return greatest(total_qty - booked_qty, 0);
end;
$$;
