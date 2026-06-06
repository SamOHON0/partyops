-- Migration 015: Payment-required mode
--
-- When payment_required is true (and the business has Stripe connected), the
-- booking widget forces the customer to pay before the booking is taken: no
-- unpaid "request" path. If a deposit_percentage is set, the customer chooses
-- between paying that deposit or paying in full; otherwise they pay in full.
-- When false, the widget keeps the request-then-optional-pay flow.

alter table businesses
  add column if not exists payment_required boolean not null default false;

comment on column businesses.payment_required is
  'When true, the booking widget requires card payment (deposit or full) before a booking is accepted. Needs Stripe connected.';

-- Comeragh Castles: require payment, with a 40% deposit option (matches their
-- current site: pay 40% deposit or pay in full).
update businesses
set payment_required = true,
    deposit_percentage = 40
where id = '7572ecb8-9f24-44b6-94fe-421c7a648e4d';
