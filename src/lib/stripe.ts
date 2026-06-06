import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (_stripe) return _stripe
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set. Add it to your environment variables to use Stripe features.'
    )
  }
  _stripe = new Stripe(key, { apiVersion: '2026-03-25.dahlia' })
  return _stripe
}

// Stripe Ireland standard pass-through for a standard EEA card: 1.5% + €0.25.
// We bake this into the application fee so the operator bears Stripe's cost
// (PartyOps is merchant of record). Pricier card types cost Stripe slightly more
// and PartyOps absorbs that small difference.
export const STRIPE_PASSTHROUGH_PERCENT = 0.015
export const STRIPE_PASSTHROUGH_FIXED_CENTS = 25

// PartyOps markup per plan, charged on top of the Stripe pass-through.
//   Starter (free):  3%
//   Pro (€29/mo):    1%
//   Scale (€79/mo):  0%
export const PLAN_MARKUP_PERCENT: Record<string, number> = {
  starter: 0.03,
  pro: 0.01,
  scale: 0,
}

/**
 * Application fee (in cents) PartyOps retains on a card charge. It covers the
 * Stripe pass-through (1.5% + €0.25) plus the plan markup. A per-business
 * override replaces the plan markup when set (e.g. 0 for comped clients), so
 * those businesses only ever pay the Stripe pass-through.
 */
export function computeApplicationFeeCents(
  chargeCents: number,
  plan: string | null | undefined,
  feeOverridePercent?: number | null,
): number {
  const markup =
    feeOverridePercent != null
      ? feeOverridePercent
      : PLAN_MARKUP_PERCENT[plan ?? 'starter'] ?? PLAN_MARKUP_PERCENT.starter
  const pct = STRIPE_PASSTHROUGH_PERCENT + markup
  return Math.round(chargeCents * pct) + STRIPE_PASSTHROUGH_FIXED_CENTS
}
