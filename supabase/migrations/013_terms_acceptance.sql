-- Migration 013: Terms & Conditions (optional, per business)
--
-- Each business decides whether to use T&Cs. If terms_enabled is true, the
-- booking widget shows a required "I agree" checkbox and the API rejects any
-- booking that hasn't accepted. Businesses can edit their terms text in-app
-- (terms_text) and/or link an external page (terms_url). When terms_enabled is
-- false, no checkbox is shown and nothing is enforced.
--
-- Backwards compatible: defaults keep terms off for every existing business.

alter table businesses
  add column if not exists terms_enabled boolean not null default false;

alter table businesses
  add column if not exists terms_text text;

alter table businesses
  add column if not exists terms_url text;

alter table bookings
  add column if not exists terms_accepted boolean not null default false;

alter table bookings
  add column if not exists terms_accepted_at timestamptz;

comment on column businesses.terms_enabled is
  'When true, the booking widget requires the customer to accept terms before booking.';
comment on column businesses.terms_text is
  'Business-editable terms & conditions text shown in the widget.';
comment on column businesses.terms_url is
  'Optional link to the business terms page, shown next to the acceptance checkbox.';
comment on column bookings.terms_accepted is
  'True when the customer ticked the terms & conditions box.';
comment on column bookings.terms_accepted_at is
  'Timestamp the customer accepted the terms.';
