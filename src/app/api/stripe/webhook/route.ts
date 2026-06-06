import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe, planForPriceId } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase'

// Disable body parsing so we can verify the Stripe signature
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Webhook secret is ALWAYS required. Never accept unsigned events - any
    // unauthenticated POST could otherwise mark bookings paid.
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not set; rejecting webhook.')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 },
      )
    }

    const event = getStripe().webhooks.constructEvent(body, signature, webhookSecret)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const bookingId = session.metadata?.booking_id

      // Only booking checkouts carry booking_id; subscription checkouts are
      // handled by the customer.subscription.* events below.
      if (bookingId) {
        const supabase = createAdminClient()
        await supabase
          .from('bookings')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', bookingId)
      }
    }

    // PartyOps subscription lifecycle -> keep the business's plan in sync.
    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const sub = event.data.object as Stripe.Subscription
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id
      if (customerId) {
        const supabase = createAdminClient()
        const priceId = sub.items?.data?.[0]?.price?.id
        const plan = planForPriceId(priceId)
        const isActive =
          event.type !== 'customer.subscription.deleted' &&
          (sub.status === 'active' || sub.status === 'trialing')

        const update: Record<string, unknown> = {
          plan_status: event.type === 'customer.subscription.deleted' ? 'canceled' : sub.status,
          stripe_subscription_id: event.type === 'customer.subscription.deleted' ? null : sub.id,
          plan: isActive && plan ? plan : 'starter',
          trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
          current_period_end: sub.items?.data?.[0]?.current_period_end
            ? new Date(sub.items.data[0].current_period_end * 1000).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        }
        await supabase.from('businesses').update(update).eq('stripe_customer_id', customerId)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }
}
