-- Migration 008: Add slug column to products for stable external linking
--
-- Purpose: Customer websites can deep-link to a specific product in the booking
-- widget via ?item=<slug>. Slugs are scoped per business so different tenants
-- can use the same slug values without collision.
--
-- Slugs are optional: existing products work fine without one. Customers who
-- want pre-fill from their site just set a slug per product.

alter table products
  add column if not exists slug text;

-- Unique index scoped per business (multi-tenant safe).
-- Using a unique index instead of a unique constraint so we can allow NULL
-- (products without a slug) without conflict.
create unique index if not exists ux_products_business_slug
  on products(business_id, slug)
  where slug is not null;

-- Helpful lookup index for the embed page reading ?item=<slug>
create index if not exists idx_products_business_slug
  on products(business_id, slug);

comment on column products.slug is
  'Optional URL-safe identifier for stable deep-linking from external sites. Unique per business when set.';
