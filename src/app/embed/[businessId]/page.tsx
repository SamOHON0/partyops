import { createAdminClient } from '@/lib/supabase'
import { getStripe } from '@/lib/stripe'
import BookingWidget from './BookingWidget'

export const dynamic = 'force-dynamic'

/**
 * A Stripe Connect account can exist (stripe_account_id is set) without being
 * able to accept payments yet - the operator may not have finished onboarding,
 * or Stripe may be holding charges for verification. We must not show "Pay
 * with card" until `charges_enabled: true`.
 */
async function stripeCanAcceptCharges(accountId: string | null): Promise<boolean> {
  if (!accountId) return false
  if (!process.env.STRIPE_SECRET_KEY) return false
  try {
    const account = await getStripe().accounts.retrieve(accountId)
    return account.charges_enabled === true
  } catch (err) {
    console.error('stripeCanAcceptCharges failed:', err)
    return false
  }
}

export default async function EmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>
  searchParams: Promise<{ payment?: string; item?: string }>
}) {
  const { businessId } = await params
  const { payment, item: preselectSlug } = await searchParams
  const supabase = createAdminClient()

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, email, phone, payment_instructions, payment_link, stripe_account_id')
    .eq('id', businessId)
    .maybeSingle()

  if (!business) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6">
        <div className="po-card max-w-sm p-6 text-center">
          <p className="text-sm text-ink-600">Booking widget not found.</p>
        </div>
      </div>
    )
  }

  const { data: products } = await supabase
    .from('products')
    .select('id, name, description, price_per_day, image_url, quantity_available, delivery_fee, slug, price_on_request')
    .eq('business_id', businessId)
    .order('name')

  // Resolve ?item=<slug> to a product id so the widget can pre-select it.
  // Slug lookup is scoped to this business (unique index on business_id+slug).
  let preselectProductId: string | null = null
  if (preselectSlug && products) {
    const match = products.find((p) => p.slug === preselectSlug)
    if (match) preselectProductId = match.id
  }

  // Show payment confirmation page
  if (payment === 'success') {
    return (
      <div className="min-h-screen bg-white font-sans antialiased text-ink-900">
        <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
          <div className="po-card p-8 text-center sm:p-10">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Payment received</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ink-600">
              Thanks for your booking. {business.name} will be in touch shortly to confirm the details.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-emerald-700">Payment confirmed</span>
            </div>
            <p className="mt-6 text-xs text-ink-500">
              A confirmation has been sent to your email. You can close this page.
            </p>
          </div>
          <p className="mt-6 text-center text-[11px] text-ink-400">
            Powered by <span className="font-medium text-ink-600">PartyOps</span>
          </p>
        </div>
      </div>
    )
  }

  // Show cancellation page
  if (payment === 'cancelled') {
    return (
      <div className="min-h-screen bg-white font-sans antialiased text-ink-900">
        <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
          <div className="po-card p-8 text-center sm:p-10">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
              <svg className="h-7 w-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Payment cancelled</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ink-600">
              Your booking request has still been submitted. You can pay later or contact {business.name} directly.
            </p>
          </div>
          <p className="mt-6 text-center text-[11px] text-ink-400">
            Powered by <span className="font-medium text-ink-600">PartyOps</span>
          </p>
        </div>
      </div>
    )
  }

  const stripeEnabled = await stripeCanAcceptCharges(business.stripe_account_id ?? null)

  // Only expose contact details to the public iframe if there's a price-on-request
  // item that would actually need them. Avoids leaking phone/email for businesses
  // that don't have any quote-only inventory.
  const hasQuoteOnlyItem = (products ?? []).some((p) => p.price_on_request)

  return (
    <BookingWidget
      businessId={businessId}
      businessName={business.name}
      businessEmail={hasQuoteOnlyItem ? business.email ?? null : null}
      businessPhone={hasQuoteOnlyItem ? business.phone ?? null : null}
      products={products ?? []}
      paymentInstructions={business.payment_instructions ?? null}
      paymentLink={business.payment_link ?? null}
      stripeEnabled={stripeEnabled}
      preselectProductId={preselectProductId}
    />
  )
}
