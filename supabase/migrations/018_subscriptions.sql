-- Migration 018: PartyOps subscription billing (platform charges operators)
--
-- These track the operator's PartyOps subscription on the PLATFORM Stripe
-- account. This is separate from stripe_account_id, which is the operator's
-- own Connect account for taking their customers' payments.

alter table businesses add column if not exists stripe_customer_id text;
alter table businesses add column if not exists stripe_subscription_id text;
alter table businesses add column if not exists plan_status text;          -- trialing | active | past_due | canceled
alter table businesses add column if not exists trial_ends_at timestamptz;
alter table businesses add column if not exists current_period_end timestamptz;

comment on column businesses.stripe_customer_id is 'PartyOps platform Stripe customer id for the subscription.';
comment on column businesses.stripe_subscription_id is 'Active PartyOps subscription id.';
comment on column businesses.plan_status is 'Subscription status: trialing, active, past_due, canceled.';

-- Comped accounts: give the agency-owned clients (and the test business) Pro
-- features without a paid subscription. Their platform_fee_percent override of 0
-- still keeps their per-booking fee at zero. The subscription webhook never
-- touches them because they have no Stripe subscription.
update businesses set plan = 'pro', plan_status = 'active'
where id in (
  'a12eb699-71ba-413c-b93d-01190296aa36',  -- Galway Bouncy Castles
  '7572ecb8-9f24-44b6-94fe-421c7a648e4d',  -- Comeragh Castles
  '40286761-83cb-4706-90dc-3158327e3f32'   -- Bounce Brigade (test)
);
