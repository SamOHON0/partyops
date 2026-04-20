-- =============================================================
-- Migration 006: invoices table + business plan tier
-- =============================================================

-- Business plan tier (Starter / Pro / Scale)
alter table businesses
  add column if not exists plan text
    default 'starter'
    check (plan in ('starter', 'pro', 'scale'));

-- -------------------------------------------------------------
-- Invoices
-- -------------------------------------------------------------
create table if not exists invoices (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  booking_id uuid references bookings(id) on delete set null,

  invoice_number text not null,
  customer_name text not null,
  customer_email text,
  customer_address text,

  issue_date date not null default (current_date),
  due_date date not null default (current_date + interval '14 days'),

  status text not null default 'draft'
    check (status in ('draft','sent','paid','overdue')),

  line_items jsonb not null default '[]'::jsonb,

  subtotal numeric(10,2) not null default 0,
  tax_rate numeric(5,2) not null default 0,
  tax_amount numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,

  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique (business_id, invoice_number)
);

create index if not exists idx_invoices_business_id on invoices(business_id);
create index if not exists idx_invoices_booking_id  on invoices(booking_id);
create index if not exists idx_invoices_status      on invoices(status);
create index if not exists idx_invoices_issue_date  on invoices(issue_date desc);

alter table invoices enable row level security;

drop policy if exists "Owner can manage own invoices" on invoices;
create policy "Owner can manage own invoices"
  on invoices for all
  using (auth.uid() = business_id)
  with check (auth.uid() = business_id);

-- Helper to generate next sequential invoice number per business (e.g. INV-0001)
create or replace function public.next_invoice_number(p_business_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max integer;
begin
  if auth.uid() is null or auth.uid() <> p_business_id then
    raise exception 'not authorized';
  end if;

  select coalesce(
    max(
      cast(
        regexp_replace(invoice_number, '^INV-0*', '') as integer
      )
    ),
    0
  ) into v_max
  from invoices
  where business_id = p_business_id
    and invoice_number ~ '^INV-[0-9]+$';

  return 'INV-' || lpad((v_max + 1)::text, 4, '0');
end;
$$;

grant execute on function public.next_invoice_number(uuid) to authenticated;
