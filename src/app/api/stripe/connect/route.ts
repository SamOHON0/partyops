import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'

// POST: Create a Stripe Connect onboarding link for the current business
export async function POST() {
  try {
    const supabase = await createServerComponentClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if business already has a Stripe account
    const { data: business } = await supabase
      .from('businesses')
      .select('stripe_account_id, name')
      .eq('id', user.id)
      .single()

    let accountId = business?.stripe_account_id

    // Create a new Stripe Connect account if they don't have one
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'standard',
        country: 'IE',
        business_type: 'individual',
        metadata: { business_id: user.id },
      })
      accountId = account.id

      // Save the Stripe account ID
      await supabase
        .from('businesses')
        .update({ stripe_account_id: accountId })
        .eq('id', user.id)
    }

    // Create an account link for onboarding
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rental-booking-eight.vercel.app'
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/admin/settings?stripe=retry`,
      return_url: `${appUrl}/admin/settings?stripe=success`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error) {
    console.error('Stripe Connect error:', error)
    return NextResponse.json({ error: 'Failed to create Stripe onboarding link' }, { status: 500 })
  }
}
