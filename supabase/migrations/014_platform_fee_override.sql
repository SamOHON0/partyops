-- Migration 014: Per-business platform fee override
--
-- The PartyOps markup normally comes from the business's plan
-- (Starter 3%, Pro 1%, Scale 0%), applied on top of the Stripe pass-through
-- (1.5% + €0.25) in code. This column lets us override that markup for a
-- specific business. Set it to 0 for comped clients so they only ever pay the
-- Stripe pass-through, regardless of plan. NULL means "use the plan markup".

alter table businesses
  add column if not exists platform_fee_percent numeric(5,4);

comment on column businesses.platform_fee_percent is
  'Overrides the plan-based PartyOps markup for this business (e.g. 0 = no markup, Stripe pass-through only). NULL = use the plan default.';

-- Comp the agency-owned clients: no PartyOps markup, Stripe pass-through only.
update businesses set platform_fee_percent = 0
where id in (
  'a12eb699-71ba-413c-b93d-01190296aa36',  -- Galway Bouncy Castles
  '7572ecb8-9f24-44b6-94fe-421c7a648e4d'   -- Comeragh Castles
);
