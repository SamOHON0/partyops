-- Migration 016: Custom booking questions (Booking Flow builder)
--
-- Each business can define its own extra questions shown in the booking widget,
-- on top of the built-in name/email/phone/address fields. Stored as an ordered
-- JSON array on the business; the customer's answers are stored per booking.
--
-- Question shape: { "id": "q1", "label": "...", "type": "text"|"checkbox", "required": true }

alter table businesses
  add column if not exists booking_questions jsonb not null default '[]'::jsonb;

alter table bookings
  add column if not exists custom_fields jsonb;

comment on column businesses.booking_questions is
  'Ordered array of custom booking-form questions defined by the business.';
comment on column bookings.custom_fields is
  'Customer answers to the business custom booking questions, keyed by question id.';
