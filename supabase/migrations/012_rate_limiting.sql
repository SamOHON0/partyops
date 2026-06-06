-- =============================================================
-- Migration 012: lightweight rate limiting
--
-- Public widget endpoints (booking creation, Stripe checkout) have no auth, so
-- a script could otherwise flood pending bookings - which also exhausts
-- availability, since get_available_quantity counts pending bookings. This adds
-- a tiny fixed-window counter, stored in Postgres so it is accurate across all
-- serverless instances (in-memory counters reset on every cold start).
--
-- The table is written only by the SECURITY DEFINER function below (and the
-- service-role client). RLS is enabled with NO policies, so anon/authenticated
-- clients can never read or write it directly.
-- =============================================================

create table if not exists rate_limits (
  bucket       text primary key,
  count        integer not null default 0,
  window_start timestamptz not null default now()
);

-- Lets a scheduled job (or manual cleanup) prune expired buckets cheaply.
create index if not exists idx_rate_limits_window_start on rate_limits(window_start);

alter table rate_limits enable row level security;
-- Intentionally no policies: only SECURITY DEFINER functions and the service
-- role (which bypasses RLS) may touch this table.

-- Atomic fixed-window check. Returns TRUE when the request is allowed, FALSE
-- when the caller has exceeded p_limit within the current p_window_seconds.
-- The whole read-increment-decide happens in one UPSERT, so concurrent calls
-- for the same bucket cannot race past the limit.
create or replace function public.check_rate_limit(
  p_bucket         text,
  p_limit          integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into rate_limits (bucket, count, window_start)
  values (p_bucket, 1, now())
  on conflict (bucket) do update
    set
      count = case
        when rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
          then 1
        else rate_limits.count + 1
      end,
      window_start = case
        when rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
          then now()
        else rate_limits.window_start
      end
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

-- Service role bypasses RLS and can call this regardless; granting to the
-- standard roles too keeps it usable from authenticated server contexts.
grant execute on function public.check_rate_limit(text, integer, integer) to anon, authenticated;
