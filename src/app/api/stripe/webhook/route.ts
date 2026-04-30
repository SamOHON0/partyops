import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
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

      if (bookingId) {
        const supabase = createAdminClient()

        // Mark booking as paid and confirmed
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

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }
}
