import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

// Platform fee percentage (e.g. 0.05 = 5%)
export const PLATFORM_FEE_PERCENT = 0.05
