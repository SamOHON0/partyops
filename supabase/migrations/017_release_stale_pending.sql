-- Migration 017: Don't let abandoned bookings hold a slot forever
--
-- Availability counted every pending booking, so an abandoned checkout locked
-- the date until someone cancelled it manually (worse in payment-required mode,
-- where every drop-off creates a pending booking). This redefines the
-- availability function to only count confirmed bookings plus pending ones
-- created in the last 30 minutes. Older unpaid pending bookings are treated as
-- abandoned and no longer block the date.

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
    and start_date <= p_end_date
    and end_date   >= p_start_date
    and (
      status = 'confirmed'
      or (status = 'pending' and created_at > now() - interval '30 minutes')
    );

  return greatest(total_qty - booked_qty, 0);
end;
$$;
