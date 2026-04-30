-- Migration 010: Add "Call for price" support to products
--
-- Purpose: some inventory is priced on request (custom quote, complex setup,
-- etc.). For these items, the booking widget should hide the price/date/payment
-- flow and surface the business's contact details instead.
--
-- Backwards compatible: defaults to false, existing products unchanged.

alter table products
  add column if not exists price_on_request boolean not null default false;

comment on column products.price_on_request is
  'When true, customer-facing widgets show "Call for price" instead of price_per_day, and replace the booking flow with the business''s contact details.';

-- Backfill: flag Adrian's 4 call-for-price items at Galway Bouncy Castles.
-- (No-op for any other business.)
update products
set price_on_request = true
where business_id = 'a12eb699-71ba-413c-b93d-01190296aa36'::uuid
  and slug in (
    'army-boot-camp-high-slide-obstacle-course',
    'rainbow-high-slide-obstacle-course',
    'gazebo-45-mtr-x-3-mtr',
    'party-marquee-8x4-mtr-with-white-pvc'
  );
