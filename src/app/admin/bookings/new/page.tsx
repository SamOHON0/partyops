import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerComponentClient } from '@/lib/supabase'
import { PageHeader, EmptyState } from '@/components/ui/PageHeader'
import { InventoryIcon, ArrowRightIcon } from '@/components/ui/Icon'

export const dynamic = 'force-dynamic'

async function createBooking(formData: FormData) {
  'use server'
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const name = (formData.get('customer_name') as string) || 'Guest'
  const phone = (formData.get('phone') as string) || ''
  const rawEmail = (formData.get('email') as string) || ''
  // Schema requires email NOT NULL; generate a per-customer synthetic so the
  // CRM can distinguish email-less customers instead of merging them.
  const slug = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 40) || 'guest'
  const email = rawEmail || `${slug(name)}-${slug(phone)}@no-email.partyops.local`

  const { error } = await supabase.rpc('admin_create_booking', {
    p_business_id: user.id,
    p_product_id: formData.get('product_id') as string,
    p_customer_name: name,
    p_email: email,
    p_phone: phone || '-',
    p_address: (formData.get('address') as string) || '-',
    p_start_date: formData.get('start_date') as string,
    p_end_date: formData.get('end_date') as string,
    p_status: (formData.get('status') as string) || 'confirmed',
  })

  if (error) {
    redirect(`/admin/bookings/new?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/admin/bookings')
  revalidatePath('/admin/calendar')
  revalidatePath('/admin')
  redirect('/admin/bookings')
}

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string
    email?: string
    name?: string
    phone?: string
    address?: string
  }>
}) {
  const {
    error,
    email: prefillEmail = '',
    name: prefillName = '',
    phone: prefillPhone = '',
    address: prefillAddress = '',
  } = await searchParams
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: products } = await supabase
    .from('products')
    .select('id, name, price_per_day')
    .eq('business_id', user.id)
    .order('name')

  const today = new Date().toISOString().slice(0, 10)
  const noProducts = !products || products.length === 0

  return (
    <>
      <div className="mb-2">
        <Link
          href="/admin/bookings"
          className="inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-900"
        >
          <span className="rotate-180">
            <ArrowRightIcon size={12} />
          </span>
          All bookings
        </Link>
      </div>

      <PageHeader
        title="Add a booking"
        description="Enter a booking that came in by phone, email, or in person."
      />

      {noProducts ? (
        <EmptyState
          icon={<InventoryIcon size={22} />}
          title="Add an item first"
          description="You need at least one rentable item before you can book it out."
          action={
            <Link href="/admin/products/new" className="po-btn po-btn-primary">
              Add an item
            </Link>
          }
        />
      ) : (
        <form action={createBooking} className="po-card max-w-2xl space-y-5 p-6">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <Field label="Item" htmlFor="product_id">
            <select id="product_id" name="product_id" required className="po-input">
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (€{p.price_per_day}/day)
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Start date" htmlFor="start_date">
              <input
                type="date"
                id="start_date"
                name="start_date"
                required
                min={today}
                className="po-input"
              />
            </Field>
            <Field label="End date" htmlFor="end_date">
              <input
                type="date"
                id="end_date"
                name="end_date"
                required
                min={today}
                className="po-input"
              />
            </Field>
          </div>

          <Field label="Customer name" htmlFor="customer_name">
            <input
              type="text"
              id="customer_name"
              name="customer_name"
              required
              defaultValue={prefillName}
              placeholder="Jane Doe"
              className="po-input"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Phone" htmlFor="phone">
              <input
                type="tel"
                id="phone"
                name="phone"
                defaultValue={prefillPhone}
                placeholder="08X XXX XXXX"
                className="po-input"
              />
            </Field>
            <Field label="Email (optional)" htmlFor="email">
              <input
                type="email"
                id="email"
                name="email"
                defaultValue={prefillEmail}
                placeholder="jane@example.com"
                className="po-input"
              />
            </Field>
          </div>

          <Field label="Delivery address" htmlFor="address">
            <input
              type="text"
              id="address"
              name="address"
              defaultValue={prefillAddress}
              placeholder="123 Main St, Dublin"
              className="po-input"
            />
          </Field>

          <Field label="Status" htmlFor="status">
            <select id="status" name="status" defaultValue="confirmed" className="po-input">
              <option value="confirmed">Confirmed</option>
              <option value="pending">New request</option>
              <option value="completed">Completed</option>
            </select>
          </Field>

          <div className="flex items-center justify-end gap-2 border-t border-ink-100 pt-4">
            <Link href="/admin/bookings" className="po-btn po-btn-ghost">
              Cancel
            </Link>
            <button type="submit" className="po-btn po-btn-primary">
              Save booking
            </button>
          </div>
        </form>
      )}
    </>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-ink-700">
        {label}
      </label>
      {children}
    </div>
  )
}
