import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { stripe, PLATFORM_FEE_PERCENT } from '@/lib/stripe'
import { corsPreflight, withCors } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request)
}

// POST: Create a Stripe Checkout session for a booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { booking_id } = body

    if (!booking_id) {
      return withCors({ error: 'booking_id is required' }, 400, request)
    }

    const supabase = createAdminClient()

    // Get the booking
    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking_id)
      .single()

    if (bookingErr || !booking) {
      return withCors({ error: 'Booking not found' }, 404, request)
    }

    // Get the product name
    const { data: product } = await supabase
      .from('products')
      .select('name')
      .eq('id', booking.product_id)
      .single()

    // Get the business stripe account
    const { data: business } = await supabase
      .from('businesses')
      .select('stripe_account_id')
      .eq('id', booking.business_id)
      .single()

    const stripeAccountId = business?.stripe_account_id
    if (!stripeAccountId) {
      return withCors({ error: 'This business has not set up Stripe payments yet' }, 400, request)
    }

    const totalInCents = Math.round(booking.total_price * 100)
    const platformFee = Math.round(totalInCents * PLATFORM_FEE_PERCENT)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rental-booking-eight.vercel.app'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${product?.name || 'Booking'} rental`,
              description: `${booking.start_date} to ${booking.end_date}`,
            },
            unit_amount: totalInCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: stripeAccountId,
        },
      },
      metadata: {
        booking_id: booking.id,
        business_id: booking.business_id,
      },
      success_url: `${appUrl}/embed/${booking.business_id}?payment=success&booking_id=${booking.id}`,
      cancel_url: `${appUrl}/embed/${booking.business_id}?payment=cancelled`,
    })

    // Save the session ID on the booking
    await supabase
      .from('bookings')
      .update({ stripe_session_id: session.id })
      .eq('id', booking_id)

    return withCors({ url: session.url }, 200, request)
  } catch (error) {
    console.error('Stripe Checkout error:', error)
    return withCors({ error: 'Failed to create checkout session' }, 500, request)
  }
}
