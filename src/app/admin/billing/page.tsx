import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase'
import { getStripe } from '@/lib/stripe'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { CheckIcon, SparklesIcon } from '@/components/ui/Icon'

export const dynamic = 'force-dynamic'

type Plan = 'starter' | 'pro' | 'scale'

type PlanInfo = {
  id: Plan
  name: string
  tagline: string
  price: number
  blurb: string
  features: string[]
  highlight?: boolean
}

const PLANS: PlanInfo[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Get going',
    price: 0,
    blurb: 'Everything you need to take bookings online.',
    features: [
      '3% per card booking + Stripe fees',
      'Up to 10 bookings / month',
      '1 embeddable booking widget',
      'Dashboard + calendar',
      'Basic customer records',
      'Email support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Most popular',
    price: 29,
    blurb: 'For busy operators with regular bookings.',
    features: [
      '1% per card booking + Stripe fees',
      'Unlimited bookings',
      'Custom branded widget',
      'Full CRM & lifetime value',
      'Invoicing with PDF export',
      'Stripe payment collection',
      'Priority support',
    ],
    highlight: true,
  },
]

// Open the Stripe customer portal so the operator can change card, switch plan,
// or cancel. Downgrades flow back in through the webhook.
async function openBillingPortal() {
  'use server'
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!business?.stripe_customer_id) {
    redirect('/admin/billing?error=' + encodeURIComponent('No subscription to manage yet.'))
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://partyops.app'
  const portal = await getStripe().billingPortal.sessions.create({
    customer: business.stripe_customer_id as string,
    return_url: `${appUrl}/admin/billing`,
  })
  redirect(portal.url)
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string; error?: string }>
}) {
  const { upgraded, error } = await searchParams
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('plan, stripe_account_id, email, stripe_customer_id, plan_status, trial_ends_at, current_period_end')
    .eq('id', user.id)
    .maybeSingle()

  const currentPlan: Plan = (business?.plan as Plan) || 'starter'
  const hasSubscription = !!business?.stripe_customer_id
  const status = business?.plan_status as string | undefined
  const renews = business?.current_period_end
    ? new Date(business.current_period_end).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <>
      <PageHeader
        title="Billing & plan"
        description="Manage your subscription. Change plans anytime. No contracts."
      />

      {upgraded && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <CheckIcon size={14} />
          You are all set. Your 14-day trial has started.
        </div>
      )}
      {error && (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* Current plan */}
      <div className="po-card mb-8 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                Current plan
              </span>
              {currentPlan === 'pro' && <Badge tone="brand" dot>Pro</Badge>}
              {currentPlan === 'scale' && <Badge tone="brand" dot>Scale</Badge>}
              {currentPlan === 'starter' && <Badge tone="neutral" dot>Starter</Badge>}
            </div>
            <div className="mt-1 text-lg font-semibold text-ink-900">
              {PLANS.find((p) => p.id === currentPlan)?.name} plan
              {currentPlan !== 'starter' && (
                <span className="ml-2 text-sm font-normal text-ink-500">
                  €{PLANS.find((p) => p.id === currentPlan)?.price}/month
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="text-xs text-ink-500">
              {status === 'trialing'
                ? `Free trial${renews ? ` · renews ${renews}` : ''}`
                : status === 'active'
                  ? `Active${renews ? ` · renews ${renews}` : ''}`
                  : status === 'past_due'
                    ? 'Payment failed · update your card'
                    : 'Billed monthly · Cancel anytime'}
            </div>
            {hasSubscription && (
              <form action={openBillingPortal}>
                <button type="submit" className="po-btn po-btn-secondary">
                  Manage billing
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Plan picker */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border bg-white p-6 transition ${
                plan.highlight
                  ? 'border-brand-300 shadow-lg shadow-brand-500/10 ring-1 ring-brand-200'
                  : 'border-ink-200 shadow-sm'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-500 to-brand-700 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                  <SparklesIcon size={11} />
                  {plan.tagline}
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold tracking-tight text-ink-900">
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm text-ink-500">{plan.blurb}</p>
              </div>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight text-ink-900">
                  €{plan.price}
                </span>
                <span className="text-sm text-ink-500">/month</span>
              </div>

              <ul className="mt-6 flex-1 space-y-2 text-sm text-ink-700">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                      <CheckIcon size={10} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {isCurrent ? (
                  <button type="button" className="po-btn po-btn-secondary w-full" disabled>
                    Current plan
                  </button>
                ) : plan.id === 'starter' ? (
                  // Downgrade to free is handled by cancelling in the portal.
                  <form action={openBillingPortal}>
                    <button type="submit" className="po-btn po-btn-secondary w-full">
                      {hasSubscription ? 'Manage / cancel' : 'Current plan'}
                    </button>
                  </form>
                ) : (
                  <a
                    href={`mailto:hello@squaretwo.ie?subject=${encodeURIComponent('PartyOps ' + plan.name)}`}
                    className={`inline-flex w-full ${plan.highlight ? 'po-btn po-btn-primary' : 'po-btn po-btn-secondary'}`}
                  >
                    Contact us to upgrade
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Payment method */}
      <div className="po-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-ink-900">Payment collection</h3>
            <p className="mt-1 text-xs text-ink-500">
              {business?.stripe_account_id
                ? 'Stripe is connected. Customers can pay directly through your booking widget.'
                : 'Connect Stripe to collect payments directly from customers.'}
            </p>
          </div>
          <div>
            {business?.stripe_account_id ? (
              <Badge tone="success" dot>
                Stripe connected
              </Badge>
            ) : (
              <a href="/admin/settings" className="po-btn po-btn-secondary">
                Connect Stripe
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-ink-100 bg-ink-50/50 p-5 text-xs text-ink-500">
        Need help choosing? Email{' '}
        <a href="mailto:hello@squaretwo.ie" className="font-medium text-brand-700 hover:underline">
          hello@squaretwo.ie
        </a>{' '}
        and we'll help you pick the right plan.
      </div>
    </>
  )
}
