-- Migration 011: Per-business deposit support
--
-- Businesses can choose to charge a partial deposit at booking time instead
-- of the full amount. The balance is settled offline (cash, transfer, etc.)
-- between the customer and the business.
--
-- When deposit_percentage = 0 (default), Stripe charges the full amount as before.
-- When deposit_percentage > 0, Stripe charges that percentage and the booking
-- tracks a `balance_due` until the operator marks it as collected.

alter table businesses
  add column if not exists deposit_percentage smallint not null default 0
    check (deposit_percentage >= 0 and deposit_percentage <= 100);

comment on column businesses.deposit_percentage is
  'If > 0, Stripe Checkout charges this percentage of the total instead of the full amount. The remaining balance is settled offline between the customer and the business.';

-- Track per-booking deposit details. NULL/zero columns mean the booking was paid in full.
alter table bookings
  add column if not exists deposit_amount numeric(10,2) default 0
    check (deposit_amount >= 0),
  add column if not exists balance_amount numeric(10,2) default 0
    check (balance_amount >= 0),
  add column if not exists balance_paid_at timestamptz;

comment on column bookings.deposit_amount is
  'Amount charged at booking time when a deposit is configured. Equals total_price for full-payment bookings.';
comment on column bookings.balance_amount is
  'Amount still owed to the business after the deposit. Zero for full-payment bookings.';
comment on column bookings.balance_paid_at is
  'Set when the operator confirms the customer has paid the remaining balance offline.';

-- Default Galway to a 30% deposit so Adrian gets the feature on next deploy.
update businesses
  set deposit_percentage = 30
  where id = 'a12eb699-71ba-413c-b93d-01190296aa36'::uuid;
