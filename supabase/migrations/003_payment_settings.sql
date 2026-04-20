-- =============================================================
-- Migration 003: payment settings on businesses
-- =============================================================

-- Free-text instructions shown to customers (IBAN, "cash on delivery", etc.)
alter table businesses add column if not exists payment_instructions text;

-- Optional clickable payment link (Revolut.me, PayPal.me, Stripe link, etc.)
alter table businesses add column if not exists payment_link text;
