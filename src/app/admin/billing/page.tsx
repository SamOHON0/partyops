import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerComponentClient } from '@/lib/supabase'
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
      'Up to 25 bookings / month',
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
      'Unlimited bookings',
      'Custom branded widget',
      'Full CRM & lifetime value',
      'Invoicing with PDF export',
      'Stripe payment collection',
      'Priority support',
    ],
    highlight: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    tagline: 'Multi-site',
    price: 79,
    blurb: 'For teams running multiple locations or brands.',
    features: [
      'Everything in Pro',
      'Multiple locations',
      'Team members & roles',
      'Custom domain',
      'API access',
      'Dedicated success manager',
    ],
  },
]

async function changePlan(formData: FormData) {
  'use server'
  const plan = formData.get('plan') as Plan
  if (!['starter', 'pro', 'scale'].includes(plan)) return

  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  // For now this just records the intent. Real Stripe upgrade flow happens separately.
  await supabase
    .from('businesses')
    .update({ plan, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  revalidatePath('/admin/billing')
  revalidatePath('/admin')
}

export default async function BillingPage() {
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('plan, stripe_account_id, email')
    .eq('id', user.id)
    .maybeSingle()

  const currentPlan: Plan = (business?.plan as Plan) || 'starter'

  return (
    <>
      <PageHeader
        title="Billing & plan"
        description="Manage your subscription. Change plans anytime. No contracts."
      />

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
          <div className="text-xs text-ink-500">
            Billed monthly · Cancel anytime
          </div>
        </div>
      </div>

      {/* Plan picker */}
      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
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
                ) : (
                  <form action={changePlan}>
                    <input type="hidden" name="plan" value={plan.id} />
                    <button
                      type="submit"
                      className={`w-full ${plan.highlight ? 'po-btn po-btn-primary' : 'po-btn po-btn-secondary'}`}
                    >
                      {plan.price > (PLANS.find((p) => p.id === currentPlan)?.price || 0)
                        ? `Upgrade to ${plan.name}`
                        : `Switch to ${plan.name}`}
                    </button>
                  </form>
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
        <a href="mailto:hello@partyops.io" className="font-medium text-brand-700 hover:underline">
          hello@partyops.io
        </a>{' '}
        and we'll help you pick the right plan.
      </div>
    </>
  )
}
