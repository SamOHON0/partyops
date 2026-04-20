import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerComponentClient } from '@/lib/supabase'
import { getBooking } from '@/lib/api/bookings'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge, Badge } from '@/components/ui/Badge'
import {
  ArrowRightIcon,
  CalendarIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  EuroIcon,
  InvoiceIcon,
  TrashIcon,
} from '@/components/ui/Icon'
import { fmtCurrencyFull, fmtDateLong, daysBetween } from '@/lib/format'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

async function updateStatus(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const status = formData.get('status') as string
  const allowed = ['pending', 'confirmed', 'completed', 'cancelled']
  if (!allowed.includes(status)) return

  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('bookings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('business_id', user.id)

  revalidatePath('/admin/bookings')
  revalidatePath(`/admin/bookings/${id}`)
  revalidatePath('/admin/calendar')
  revalidatePath('/admin')
}

async function updatePayment(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const payment_status = formData.get('payment_status') as string
  const allowed = ['paid', 'unpaid', 'refunded']
  if (!allowed.includes(payment_status)) return

  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('bookings')
    .update({ payment_status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('business_id', user.id)

  revalidatePath('/admin/bookings')
  revalidatePath(`/admin/bookings/${id}`)
}

async function removeBooking(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('bookings').delete().eq('id', id).eq('business_id', user.id)
  revalidatePath('/admin/bookings')
  revalidatePath('/admin/calendar')
  revalidatePath('/admin')
  redirect('/admin/bookings')
}

export default async function BookingDetail({ params }: PageProps) {
  const { id } = await params
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const booking = await getBooking(id)
  if (!booking || booking.business_id !== user.id) notFound()

  const days = daysBetween(booking.start_date, booking.end_date)
  const pricePerDay = booking.product?.price_per_day || 0
  const deliveryFee = booking.product?.delivery_fee || 0

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
        title={booking.customer_name}
        description={`${booking.product?.name || 'Booking'} · ${fmtDateLong(booking.start_date)}${
          booking.end_date !== booking.start_date ? ' to ' + fmtDateLong(booking.end_date) : ''
        }`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={booking.status} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Main column */}
        <div className="space-y-6">
          {/* Quick actions */}
          <div className="po-card p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">
              Actions
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {booking.status === 'pending' && (
                <form action={updateStatus}>
                  <input type="hidden" name="id" value={booking.id} />
                  <input type="hidden" name="status" value="confirmed" />
                  <button type="submit" className="po-btn po-btn-primary">
                    Confirm booking
                  </button>
                </form>
              )}
              {booking.status === 'confirmed' && (
                <form action={updateStatus}>
                  <input type="hidden" name="id" value={booking.id} />
                  <input type="hidden" name="status" value="completed" />
                  <button type="submit" className="po-btn po-btn-primary">
                    Mark as completed
                  </button>
                </form>
              )}
              {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                <form action={updateStatus}>
                  <input type="hidden" name="id" value={booking.id} />
                  <input type="hidden" name="status" value="cancelled" />
                  <button type="submit" className="po-btn po-btn-secondary">
                    Cancel booking
                  </button>
                </form>
              )}
              {booking.status === 'cancelled' && (
                <form action={updateStatus}>
                  <input type="hidden" name="id" value={booking.id} />
                  <input type="hidden" name="status" value="pending" />
                  <button type="submit" className="po-btn po-btn-secondary">
                    Reopen
                  </button>
                </form>
              )}
              <Link
                href={`/admin/invoices/new?booking=${booking.id}`}
                className="po-btn po-btn-secondary"
              >
                <InvoiceIcon size={15} />
                Create invoice
              </Link>
            </div>
          </div>

          {/* Customer */}
          <div className="po-card p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">
              Customer
            </h3>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailField
                icon={<MailIcon size={14} />}
                label="Email"
                value={booking.email ? (
                  <a
                    href={`mailto:${booking.email}`}
                    className="text-brand-700 hover:underline"
                  >
                    {booking.email}
                  </a>
                ) : (
                  <span className="text-ink-400">Not provided</span>
                )}
              />
              <DetailField
                icon={<PhoneIcon size={14} />}
                label="Phone"
                value={
                  booking.phone ? (
                    <a
                      href={`tel:${booking.phone}`}
                      className="text-brand-700 hover:underline"
                    >
                      {booking.phone}
                    </a>
                  ) : (
                    <span className="text-ink-400">Not provided</span>
                  )
                }
              />
              <DetailField
                icon={<MapPinIcon size={14} />}
                label="Delivery address"
                value={booking.address || <span className="text-ink-400">-</span>}
                full
              />
            </dl>
          </div>

          {/* Booking */}
          <div className="po-card p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">
              Booking details
            </h3>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailField
                icon={<CalendarIcon size={14} />}
                label="Start date"
                value={fmtDateLong(booking.start_date)}
              />
              <DetailField
                icon={<CalendarIcon size={14} />}
                label="End date"
                value={fmtDateLong(booking.end_date)}
              />
              <DetailField
                label="Duration"
                value={`${days} day${days === 1 ? '' : 's'}`}
              />
              <DetailField
                label="Item"
                value={booking.product?.name || '-'}
              />
              <DetailField
                label="Created"
                value={new Date(booking.created_at).toLocaleString('en-IE', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              />
              <DetailField
                label="Booking ID"
                value={
                  <code className="font-mono text-[11px] text-ink-500">
                    {booking.id.slice(0, 8)}
                  </code>
                }
              />
            </dl>
          </div>

          {/* Danger */}
          <div className="po-card border-rose-200 p-5">
            <h3 className="mb-1 text-sm font-semibold text-ink-900">Delete booking</h3>
            <p className="mb-3 text-xs text-ink-500">
              Removing a booking is permanent. For cancellations, use cancel instead.
            </p>
            <form action={removeBooking}>
              <input type="hidden" name="id" value={booking.id} />
              <button type="submit" className="po-btn po-btn-danger">
                <TrashIcon size={15} />
                Delete permanently
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Payment */}
          <div className="po-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                Payment
              </h3>
              {booking.payment_status === 'paid' ? (
                <Badge tone="success" dot>Paid</Badge>
              ) : booking.payment_status === 'refunded' ? (
                <Badge tone="neutral" dot>Refunded</Badge>
              ) : (
                <Badge tone="warning" dot>Unpaid</Badge>
              )}
            </div>

            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between text-ink-600">
                <span>
                  {days} day{days === 1 ? '' : 's'} × {fmtCurrencyFull(pricePerDay)}
                </span>
                <span>{fmtCurrencyFull(days * pricePerDay)}</span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex items-center justify-between text-ink-600">
                  <span>Delivery</span>
                  <span>{fmtCurrencyFull(deliveryFee)}</span>
                </div>
              )}
              <div className="mt-2 flex items-center justify-between border-t border-ink-100 pt-2 text-base font-semibold text-ink-900">
                <span>Total</span>
                <span>{fmtCurrencyFull(Number(booking.total_price || 0))}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {booking.payment_status !== 'paid' && (
                <form action={updatePayment}>
                  <input type="hidden" name="id" value={booking.id} />
                  <input type="hidden" name="payment_status" value="paid" />
                  <button type="submit" className="po-btn po-btn-secondary w-full text-xs">
                    <EuroIcon size={14} />
                    Mark as paid
                  </button>
                </form>
              )}
              {booking.payment_status === 'paid' && (
                <form action={updatePayment}>
                  <input type="hidden" name="id" value={booking.id} />
                  <input type="hidden" name="payment_status" value="unpaid" />
                  <button type="submit" className="po-btn po-btn-ghost w-full text-xs">
                    Mark as unpaid
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="po-card p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">
              Timeline
            </h3>
            <ol className="space-y-3 text-sm">
              <TimelineEntry
                label="Booking created"
                time={new Date(booking.created_at).toLocaleString('en-IE', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
                tone="brand"
              />
              {booking.updated_at !== booking.created_at && (
                <TimelineEntry
                  label={`Status: ${booking.status}`}
                  time={new Date(booking.updated_at).toLocaleString('en-IE', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                  tone="neutral"
                />
              )}
            </ol>
          </div>
        </aside>
      </div>
    </>
  )
}

function DetailField({
  label,
  value,
  icon,
  full,
}: {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
  full?: boolean
}) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-400">
        {icon}
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-ink-900">{value}</dd>
    </div>
  )
}

function TimelineEntry({
  label,
  time,
  tone,
}: {
  label: string
  time: string
  tone: 'brand' | 'neutral'
}) {
  const dot = tone === 'brand' ? 'bg-brand-500' : 'bg-ink-300'
  return (
    <li className="flex items-start gap-3">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} />
      <div className="min-w-0 flex-1">
        <div className="text-sm text-ink-900">{label}</div>
        <div className="text-[11px] text-ink-500">{time}</div>
      </div>
    </li>
  )
}
