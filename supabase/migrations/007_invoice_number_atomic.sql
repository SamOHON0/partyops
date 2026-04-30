-- Make next_invoice_number concurrency-safe.
--
-- The original implementation read max(invoice_number)+1 without any locking,
-- which meant two concurrent calls could return the same number and the
-- second insert would fail the unique(business_id, invoice_number) constraint.
--
-- We take a per-business transaction-level advisory lock so only one call at
-- a time can be computing the next number for a given business. The lock is
-- released automatically at transaction end.

create or replace function public.next_invoice_number(p_business_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max integer;
  v_lock_key bigint;
begin
  if auth.uid() is null or auth.uid() <> p_business_id then
    raise exception 'not authorized';
  end if;

  -- Serialize number generation per-business. hashtext() returns int4 which
  -- fits into the 64-bit lock key Postgres wants.
  v_lock_key := hashtext(p_business_id::text);
  perform pg_advisory_xact_lock(v_lock_key);

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
