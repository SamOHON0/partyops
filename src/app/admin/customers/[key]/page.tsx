import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase'
import { getCustomerByKey } from '@/lib/api/customers'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import {
  ArrowRightIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  InvoiceIcon,
  PlusIcon,
} from '@/components/ui/Icon'
import { fmtCurrency, fmtDateMedium, relativeDays } from '@/lib/format'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ key: string }>
}

export default async function CustomerDetail({ params }: PageProps) {
  const { key } = await params
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const decoded = decodeURIComponent(key)
  const customer = await getCustomerByKey(user.id, decoded)
  if (!customer) notFound()

  const initials = (customer.name || customer.email || '?')
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const sortedBookings = [...customer.bookings].sort((a, b) =>
    b.start_date.localeCompare(a.start_date),
  )

  const confirmedOrCompleted = customer.statuses.confirmed + customer.statuses.completed
  const pending = customer.statuses.pending
  const cancelled = customer.statuses.cancelled

  return (
    <>
      <div className="mb-2">
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-900"
        >
          <span className="rotate-180">
            <ArrowRightIcon size={12} />
          </span>
          All customers
        </Link>
      </div>

      <PageHeader
        title={customer.name || customer.email || 'Customer'}
        description={`Customer since ${fmtDateMedium(customer.first_booking_date)} · ${relativeDays(customer.last_booking_date)} last booked`}
        actions={
          customer.bookings_count > 1 ? (
            <Badge tone="brand" dot>
              Repeat customer
            </Badge>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        {/* Profile */}
        <aside className="space-y-6">
          <div className="po-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-base font-semibold text-white">
                {initials || 'G'}
              </div>
              <div className="min-w-0">
                <div className="truncate text-base font-semibold text-ink-900">
                  {customer.name}
                </div>
                <div className="text-xs text-ink-500">
                  {customer.bookings_count} booking{customer.bookings_count === 1 ? '' : 's'}
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {customer.email && (
                <ContactRow
                  icon={<MailIcon size={14} />}
                  label="Email"
                  value={
                    <a
                      href={`mailto:${customer.email}`}
                      className="text-brand-700 hover:underline"
                    >
                      {customer.email}
                    </a>
                  }
                />
              )}
              {customer.phone && (
                <ContactRow
                  icon={<PhoneIcon size={14} />}
                  label="Phone"
                  value={
                    <a
                      href={`tel:${customer.phone}`}
                      className="text-brand-700 hover:underline"
                    >
                      {customer.phone}
                    </a>
                  }
                />
              )}
              {customer.address && (
                <ContactRow
                  icon={<MapPinIcon size={14} />}
                  label="Address"
                  value={customer.address}
                />
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={`/admin/bookings/new?email=${encodeURIComponent(customer.email || '')}&name=${encodeURIComponent(customer.name || '')}`}
                className="po-btn po-btn-primary text-xs"
              >
                <PlusIcon size={14} />
                New booking
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="po-card p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">
              At a glance
            </h3>
            <dl className="space-y-3 text-sm">
              <StatRow label="Lifetime value" value={fmtCurrency(customer.lifetime_value)} strong />
              <StatRow
                label="Avg. booking value"
                value={fmtCurrency(
                  Math.round(customer.lifetime_value / Math.max(1, customer.bookings_count)),
                )}
              />
              <StatRow label="Total bookings" value={String(customer.bookings_count)} />
              <StatRow
                label="Active / completed"
                value={String(confirmedOrCompleted)}
              />
              {pending > 0 && <StatRow label="Pending" value={String(pending)} />}
              {cancelled > 0 && <StatRow label="Cancelled" value={String(cancelled)} />}
            </dl>
          </div>
        </aside>

        {/* Bookings history */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-900">
              Booking history ({customer.bookings_count})
            </h2>
            {customer.email && (
              <Link
                href={`/admin/invoices/new?email=${encodeURIComponent(customer.email)}&name=${encodeURIComponent(customer.name || '')}`}
                className="po-btn po-btn-ghost text-xs"
              >
                <InvoiceIcon size={14} />
                Create invoice
              </Link>
            )}
          </div>

          <div className="po-card divide-y divide-ink-100">
            {sortedBookings.map((b) => (
              <Link
                key={b.id}
                href={`/admin/bookings/${b.id}`}
                className="flex items-center gap-4 px-4 py-3 transition hover:bg-ink-50/40"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-ink-900">
                      {b.product?.name || 'Booking'}
                    </span>
                    <StatusBadge status={b.status} />
                    {b.payment_status === 'paid' && (
                      <Badge tone="success">Paid</Badge>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-ink-500">
                    {fmtDateMedium(b.start_date)}
                    {b.end_date !== b.start_date ? ` - ${fmtDateMedium(b.end_date)}` : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-ink-900">
                    {fmtCurrency(Number(b.total_price || 0))}
                  </div>
                  <div className="text-[10px] text-ink-400">
                    {relativeDays(b.start_date)}
                  </div>
                </div>
                <ArrowRightIcon size={14} />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}

function ContactRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-ink-400">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-medium uppercase tracking-wider text-ink-400">
          {label}
        </div>
        <div className="truncate text-sm text-ink-900">{value}</div>
      </div>
    </div>
  )
}

function StatRow({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd className={strong ? 'text-base font-semibold text-ink-900' : 'text-sm text-ink-900'}>
        {value}
      </dd>
    </div>
  )
}
