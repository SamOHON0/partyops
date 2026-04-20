-- Add Stripe Connect account ID to businesses
alter table businesses add column if not exists stripe_account_id text;

-- Add payment status to bookings
alter table bookings add column if not exists payment_status text default 'unpaid'
  check (payment_status in ('unpaid', 'paid', 'refunded'));
alter table bookings add column if not exists stripe_session_id text;
