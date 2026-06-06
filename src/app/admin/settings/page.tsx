import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase'
import StripeConnectButton from './StripeConnectButton'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { CheckIcon } from '@/components/ui/Icon'

export const dynamic = 'force-dynamic'

async function saveSettings(formData: FormData) {
  'use server'
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  // Clamp deposit_percentage to 0-100
  const depositRaw = parseInt((formData.get('deposit_percentage') as string) || '0', 10)
  const depositPct = Number.isFinite(depositRaw) ? Math.max(0, Math.min(100, depositRaw)) : 0

  await supabase
    .from('businesses')
    .update({
      name: (formData.get('name') as string) || undefined,
      phone: (formData.get('phone') as string) || null,
      address: (formData.get('address') as string) || null,
      payment_instructions: (formData.get('payment_instructions') as string) || null,
      payment_link: (formData.get('payment_link') as string) || null,
      terms_enabled: formData.get('terms_enabled') === 'on',
      terms_text: (formData.get('terms_text') as string) || null,
      terms_url: (formData.get('terms_url') as string) || null,
      deposit_percentage: depositPct,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  revalidatePath('/admin/settings')
  revalidatePath('/admin')
  redirect('/admin/settings?saved=1')
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>
}) {
  const { saved } = await searchParams
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!business) return null

  return (
    <>
      <PageHeader
        title="Settings"
        description="Business details, payment preferences, and account."
      />

      {saved && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <CheckIcon size={14} />
          Settings saved.
        </div>
      )}

      <form action={saveSettings} className="max-w-2xl space-y-6">
        {/* Business details */}
        <section className="po-card p-5">
          <h2 className="mb-1 text-sm font-semibold text-ink-900">Business details</h2>
          <p className="mb-4 text-xs text-ink-500">
            Appears on invoices, emails, and your booking widget header.
          </p>

          <div className="space-y-4">
            <Field
              label="Business name"
              name="name"
              defaultValue={business.name}
              placeholder="e.g. Dublin Party Hire"
              required
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Phone number"
                name="phone"
                type="tel"
                defaultValue={business.phone ?? ''}
                placeholder="08X XXX XXXX"
              />
              <Field
                label="Address"
                name="address"
                defaultValue={business.address ?? ''}
                placeholder="Your business address"
              />
            </div>
          </div>
        </section>

        {/* Terms & conditions */}
        <section className="po-card p-5">
          <h2 className="mb-1 text-sm font-semibold text-ink-900">Terms &amp; conditions</h2>
          <p className="mb-4 text-xs text-ink-500">
            Optional. Turn this on to make customers agree to your terms before they can book.
          </p>

          <label className="mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              name="terms_enabled"
              defaultChecked={business.terms_enabled ?? false}
              className="h-4 w-4 rounded border-ink-300 text-brand-600"
            />
            <span className="text-sm text-ink-800">Require customers to accept terms before booking</span>
          </label>

          <div>
            <label htmlFor="terms_text" className="mb-1.5 block text-xs font-medium text-ink-700">
              Terms text
            </label>
            <textarea
              id="terms_text"
              name="terms_text"
              rows={6}
              defaultValue={business.terms_text ?? ''}
              placeholder="Write your booking, delivery and cancellation terms here. Customers can view this in the booking widget."
              className="po-input"
            />
          </div>

          <div className="mt-4">
            <label htmlFor="terms_url" className="mb-1.5 block text-xs font-medium text-ink-700">
              Terms link (optional)
            </label>
            <input
              id="terms_url"
              name="terms_url"
              type="url"
              defaultValue={business.terms_url ?? ''}
              placeholder="https://yoursite.com/terms"
              className="po-input"
            />
            <p className="mt-1 text-[11px] text-ink-500">
              If set, the checkbox links here. Otherwise customers view the terms text above.
            </p>
          </div>
        </section>

        {/* Payment */}
        <section className="po-card p-5">
          <h2 className="mb-1 text-sm font-semibold text-ink-900">Payment instructions</h2>
          <p className="mb-4 text-xs text-ink-500">
            Shown to customers after they book. Include bank details, a payment link, or your
            preferred method.
          </p>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="payment_instructions"
                className="mb-1.5 block text-xs font-medium text-ink-700"
              >
                How customers should pay
              </label>
              <textarea
                id="payment_instructions"
                name="payment_instructions"
                rows={3}
                defaultValue={business.payment_instructions ?? ''}
                placeholder={'e.g. Please transfer to:\nIBAN: IE12 BOFI 9000 1234 5678 90\nAccount: Your Business Ltd\n\nOr pay cash on delivery.'}
                className="po-input"
              />
            </div>

            <div>
              <label
                htmlFor="payment_link"
                className="mb-1.5 block text-xs font-medium text-ink-700"
              >
                Payment link (optional)
              </label>
              <input
                id="payment_link"
                name="payment_link"
                type="url"
                defaultValue={business.payment_link ?? ''}
                placeholder="https://revolut.me/yourbusiness"
                className="po-input"
              />
              <p className="mt-1 text-[11px] text-ink-500">
                Revolut.me, PayPal.me, Stripe link, etc. Customers see a "Pay now" button.
              </p>
            </div>
          </div>
        </section>

        {/* Stripe Connect */}
        <section className="po-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink-900">Stripe payments</h2>
              <p className="mt-0.5 text-xs text-ink-500">
                Collect payments directly through your booking widget.
              </p>
            </div>
            {business.stripe_account_id ? (
              <Badge tone="success" dot>Connected</Badge>
            ) : (
              <Badge tone="neutral">Not connected</Badge>
            )}
          </div>
          <StripeConnectButton
            connected={!!business.stripe_account_id}
            accountId={business.stripe_account_id}
          />

          <div className="mt-5 border-t border-ink-100 pt-5">
            <label htmlFor="deposit_percentage" className="mb-1.5 block text-xs font-medium text-ink-700">
              Deposit percentage
            </label>
            <div className="flex items-center gap-2">
              <input
                id="deposit_percentage"
                name="deposit_percentage"
                type="number"
                min="0"
                max="100"
                step="1"
                defaultValue={String(business.deposit_percentage ?? 0)}
                className="po-input"
                style={{ maxWidth: '120px' }}
              />
              <span className="text-sm text-ink-600">%</span>
            </div>
            <p className="mt-1.5 text-[11px] text-ink-500">
              Set to 0 to charge the full amount on booking (default). Set to e.g. 30 to charge a 30% deposit at booking and collect the remaining balance directly from the customer (cash, transfer, or however you prefer). The widget shows the customer the breakdown clearly.
            </p>
          </div>
        </section>

        <div className="flex items-center justify-end gap-2 border-t border-ink-100 pt-4">
          <button type="submit" className="po-btn po-btn-primary">
            Save settings
          </button>
        </div>
      </form>
    </>
  )
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = 'text',
  required,
}: {
  label: string
  name: string
  defaultValue?: string
  placeholder?: string
  type?: string
  required?: boolean
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs font-medium text-ink-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="po-input"
      />
    </div>
  )
}
