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

// Platform fee percentage (e.g. 0.05 = 5%)
export const PLATFORM_FEE_PERCENT = 0.05
