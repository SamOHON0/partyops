import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase'
import { getBookings } from '@/lib/api/bookings'
import { PageHeader, EmptyState } from '@/components/ui/PageHeader'
import { StatusBadge, Badge } from '@/components/ui/Badge'
import {
  BookingsIcon,
  PlusIcon,
  SearchIcon,
  ArrowRightIcon,
} from '@/components/ui/Icon'
import { BookingSearch } from '@/components/admin/BookingSearch'
import { fmtCurrency, fmtDateMedium } from '@/lib/format'
import type { BookingStatus, BookingWithProduct } from '@/lib/types'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{
  status?: string
  q?: string
  payment?: string
}>

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
  revalidatePath('/admin')
  revalidatePath('/admin/calendar')
}

export default async function AdminBookings({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const bookings = await getBookings(user.id)

  const statusFilter = params.status || ''
  const paymentFilter = params.payment || ''
  const query = (params.q || '').trim().toLowerCase()

  const filtered = bookings.filter((b) => {
    if (statusFilter && b.status !== statusFilter) return false
    if (paymentFilter && (b.payment_status || 'unpaid') !== paymentFilter) return false
    if (query) {
      const hay = [
        b.customer_name,
        b.email,
        b.phone,
        b.address,
        b.product?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!hay.includes(query)) return false
    }
    return true
  })

  const counts: Record<'all' | BookingStatus, number> = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
  }

  const tabs: { label: string; value: string; count: number }[] = [
    { label: 'All', value: '', count: counts.all },
    { label: 'New', value: 'pending', count: counts.pending },
    { label: 'Confirmed', value: 'confirmed', count: counts.confirmed },
    { label: 'Completed', value: 'completed', count: counts.completed },
    { label: 'Cancelled', value: 'cancelled', count: counts.cancelled },
  ]

  function buildHref(overrides: Partial<{ status: string; q: string; payment: string }>) {
    const merged = {
      status: statusFilter,
      q: query,
      payment: paymentFilter,
      ...overrides,
    }
    const qs = new URLSearchParams()
    if (merged.status) qs.set('status', merged.status)
    if (merged.q) qs.set('q', merged.q)
    if (merged.payment) qs.set('payment', merged.payment)
    const str = qs.toString()
    return str ? `/admin/bookings?${str}` : '/admin/bookings'
  }

  return (
    <>
      <PageHeader
        title="Bookings"
        description="Every request in one place. Confirm, complete, and keep the pipeline moving."
        actions={
          <Link href="/admin/bookings/new" className="po-btn po-btn-primary">
            <PlusIcon size={16} />
            Add booking
          </Link>
        }
      />

      {bookings.length === 0 ? (
        <EmptyState
          icon={<BookingsIcon size={22} />}
          title="No bookings yet"
          description="When customers book through your widget or you add them manually, they'll appear here."
          action={
            <Link href="/admin/bookings/new" className="po-btn po-btn-primary">
              <PlusIcon size={16} />
              Add your first booking
            </Link>
          }
        />
      ) : (
        <>
          {/* Tabs + search */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1">
              {tabs.map((tab) => {
                const isActive = statusFilter === tab.value
                return (
                  <Link
                    key={tab.value || 'all'}
                    href={buildHref({ status: tab.value })}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                        isActive ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-500'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </Link>
                )
              })}
            </div>

            <BookingSearch
              defaultValue={query}
              statusFilter={statusFilter}
              paymentFilter={paymentFilter}
            />
          </div>

          {/* Secondary filter: payment */}
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-ink-500">
            <span className="font-medium text-ink-400">Payment:</span>
            {[
              { label: 'Any', value: '' },
              { label: 'Paid', value: 'paid' },
              { label: 'Unpaid', value: 'unpaid' },
              { label: 'Refunded', value: 'refunded' },
            ].map((p) => {
              const active = paymentFilter === p.value
              return (
                <Link
                  key={p.value || 'any'}
                  href={buildHref({ payment: p.value })}
                  className={`rounded-full border px-2.5 py-0.5 font-medium transition ${
                    active
                      ? 'border-brand-200 bg-brand-50 text-brand-700'
                      : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300'
                  }`}
                >
                  {p.label}
                </Link>
              )
            })}
            {(statusFilter || paymentFilter || query) && (
              <Link
                href="/admin/bookings"
                className="ml-2 text-[11px] font-medium text-brand-600 hover:text-brand-700"
              >
                Clear filters
              </Link>
            )}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<SearchIcon size={22} />}
              title="No bookings match"
              description="Try a different search or clear your filters."
              action={
                <Link href="/admin/bookings" className="po-btn po-btn-secondary">
                  Clear filters
                </Link>
              }
            />
          ) : (
            <div className="po-card overflow-hidden">
              <div className="hidden border-b border-ink-100 bg-ink-50/40 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500 sm:grid sm:grid-cols-[1.5fr_1.2fr_1fr_0.8fr_0.6fr_auto] sm:gap-4">
                <div>Customer</div>
                <div>Item</div>
                <div>Dates</div>
                <div>Total</div>
                <div>Status</div>
                <div className="sr-only">Actions</div>
              </div>

              <ul className="divide-y divide-ink-100">
                {filtered.map((b) => (
                  <BookingRow key={b.id} booking={b} onUpdateStatus={updateStatus} />
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3 text-xs text-ink-400">
            Showing <span className="font-medium text-ink-600">{filtered.length}</span> of{' '}
            {bookings.length} bookings
          </div>
        </>
      )}
    </>
  )
}

function BookingRow({
  booking,
  onUpdateStatus,
}: {
  booking: BookingWithProduct
  onUpdateStatus: (formData: FormData) => void
}) {
  const initials = (booking.customer_name || '?')
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <li className="px-4 py-3 transition hover:bg-ink-50/40 sm:grid sm:grid-cols-[1.5fr_1.2fr_1fr_0.8fr_0.6fr_auto] sm:items-center sm:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-semibold text-white">
          {initials || 'G'}
        </div>
        <div className="min-w-0">
          <Link
            href={`/admin/bookings/${booking.id}`}
            className="truncate text-sm font-semibold text-ink-900 hover:text-brand-700"
          >
            {booking.customer_name}
          </Link>
          <div className="truncate text-[11px] text-ink-500">{booking.email}</div>
        </div>
      </div>

      <div className="mt-1 min-w-0 text-sm text-ink-700 sm:mt-0">
        <div className="truncate">{booking.product?.name || '-'}</div>
        <div className="truncate text-[11px] text-ink-500 sm:hidden">
          {fmtDateMedium(booking.start_date)}
          {booking.end_date !== booking.start_date
            ? ` - ${fmtDateMedium(booking.end_date)}`
            : ''}
        </div>
      </div>

      <div className="hidden text-sm text-ink-700 sm:block">
        <div className="truncate">{fmtDateMedium(booking.start_date)}</div>
        {booking.end_date !== booking.start_date && (
          <div className="truncate text-[11px] text-ink-500">
            to {fmtDateMedium(booking.end_date)}
          </div>
        )}
      </div>

      <div className="mt-1 flex items-baseline gap-2 sm:mt-0 sm:block">
        <div className="text-sm font-semibold text-ink-900">
          {fmtCurrency(Number(booking.total_price || 0))}
        </div>
        <div className="sm:mt-0.5">
          {booking.payment_status && booking.payment_status !== 'unpaid' ? (
            <Badge tone={booking.payment_status === 'paid' ? 'success' : 'neutral'}>
              {booking.payment_status === 'paid' ? 'Paid' : 'Refunded'}
            </Badge>
          ) : (
            <span className="text-[10px] text-ink-400">Unpaid</span>
          )}
        </div>
      </div>

      <div className="mt-2 sm:mt-0">
        <StatusBadge status={booking.status} />
      </div>

      <div className="mt-2 flex items-center gap-2 sm:mt-0 sm:justify-end">
        {booking.status === 'pending' && (
          <form action={onUpdateStatus}>
            <input type="hidden" name="id" value={booking.id} />
            <input type="hidden" name="status" value="confirmed" />
            <button
              type="submit"
              className="po-btn po-btn-secondary px-2.5 py-1 text-xs"
              title="Confirm"
            >
              Confirm
            </button>
          </form>
        )}
        {booking.status === 'confirmed' && (
          <form action={onUpdateStatus}>
            <input type="hidden" name="id" value={booking.id} />
            <input type="hidden" name="status" value="completed" />
            <button
              type="submit"
              className="po-btn po-btn-secondary px-2.5 py-1 text-xs"
              title="Mark completed"
            >
              Complete
            </button>
          </form>
        )}
        <Link
          href={`/admin/bookings/${booking.id}`}
          className="po-btn po-btn-ghost px-2 py-1 text-xs"
          aria-label="View details"
          title="View details"
        >
          <ArrowRightIcon size={14} />
        </Link>
      </div>
    </li>
  )
}
