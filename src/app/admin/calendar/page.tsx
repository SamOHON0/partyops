import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase'
import { getBookings } from '@/lib/api/bookings'
import { PageHeader, EmptyState } from '@/components/ui/PageHeader'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { CalendarIcon, ChevronDownIcon, PlusIcon } from '@/components/ui/Icon'
import { fmtCurrency, fmtDateMedium } from '@/lib/format'
import type { BookingStatus, BookingWithProduct } from '@/lib/types'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ month?: string }>

// Date helpers (treat dates as local date-only strings, YYYY-MM-DD)
function ymd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Parse a YYYY-MM-DD string into a local-midnight Date. Using `new Date("YYYY-MM-DD")`
// treats the string as UTC, which can shift to the previous day when rendered in
// a westerly timezone. Always construct from the parsed integer parts instead.
function parseYMD(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

function parseMonth(s?: string): { year: number; month: number } {
  const now = new Date()
  if (!s) return { year: now.getFullYear(), month: now.getMonth() }
  const m = /^(\d{4})-(\d{1,2})$/.exec(s)
  if (!m) return { year: now.getFullYear(), month: now.getMonth() }
  const year = Number(m[1])
  const month = Math.min(11, Math.max(0, Number(m[2]) - 1))
  return { year, month }
}

function monthParam(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

function addMonths(year: number, month: number, delta: number) {
  const d = new Date(year, month + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() }
}

// Build 6-row grid starting Monday
function buildGrid(year: number, month: number): Date[][] {
  const firstOfMonth = new Date(year, month, 1)
  // Monday = 0, Sunday = 6 (en-IE)
  const dayOfWeek = (firstOfMonth.getDay() + 6) % 7
  const start = new Date(year, month, 1 - dayOfWeek)
  const weeks: Date[][] = []
  for (let w = 0; w < 6; w++) {
    const days: Date[] = []
    for (let d = 0; d < 7; d++) {
      days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d))
    }
    weeks.push(days)
  }
  return weeks
}

const STATUS_STYLE: Record<BookingStatus, { bar: string; dot: string }> = {
  confirmed: { bar: 'bg-brand-100 text-brand-800 hover:bg-brand-200', dot: 'bg-brand-500' },
  pending: { bar: 'bg-amber-100 text-amber-800 hover:bg-amber-200', dot: 'bg-amber-500' },
  completed: { bar: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200', dot: 'bg-emerald-500' },
  cancelled: { bar: 'bg-ink-100 text-ink-500 line-through hover:bg-ink-200', dot: 'bg-ink-400' },
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const sp = await searchParams
  const { year, month } = parseMonth(sp?.month)
  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-IE', {
    month: 'long',
    year: 'numeric',
  })
  const prev = addMonths(year, month, -1)
  const next = addMonths(year, month, 1)
  const now = new Date()
  const today = ymd(now)
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  const bookings = await getBookings(user.id)

  // Index bookings by date (expand multi-day spans). Parse ISO dates as
  // local-midnight to avoid UTC shift errors.
  const byDate = new Map<string, BookingWithProduct[]>()
  for (const b of bookings) {
    if (!b.start_date || !b.end_date) continue
    const s = parseYMD(b.start_date)
    const e = parseYMD(b.end_date)
    for (
      let d = new Date(s.getFullYear(), s.getMonth(), s.getDate());
      d.getTime() <= e.getTime();
      d.setDate(d.getDate() + 1)
    ) {
      const key = ymd(d)
      if (!byDate.has(key)) byDate.set(key, [])
      byDate.get(key)!.push(b)
    }
  }

  const grid = buildGrid(year, month)
  const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // Monthly roll-up stats for the header row
  const monthStart = ymd(new Date(year, month, 1))
  const monthEnd = ymd(new Date(year, month + 1, 0))
  const monthBookings = bookings.filter(
    (b) => b.start_date <= monthEnd && b.end_date >= monthStart && b.status !== 'cancelled',
  )
  const monthRevenue = monthBookings.reduce((s, b) => s + Number(b.total_price || 0), 0)

  return (
    <>
      <PageHeader
        title="Calendar"
        description="See your bookings at a glance. Click any event to view details."
        actions={
          <Link href="/admin/bookings/new" className="po-btn po-btn-primary">
            <PlusIcon size={16} />
            New booking
          </Link>
        }
      />

      {bookings.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon size={22} />}
          title="Nothing on the calendar yet"
          description="Once bookings come in, they'll show up here across the month."
          action={
            <Link href="/admin/bookings/new" className="po-btn po-btn-primary">
              <PlusIcon size={16} />
              Create your first booking
            </Link>
          }
        />
      ) : (
        <div className="po-card overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-ink-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/calendar?month=${monthParam(prev.year, prev.month)}`}
                className="po-btn po-btn-ghost px-2.5"
                aria-label="Previous month"
              >
                <span className="rotate-90">
                  <ChevronDownIcon size={16} />
                </span>
              </Link>
              <Link
                href={`/admin/calendar?month=${monthParam(next.year, next.month)}`}
                className="po-btn po-btn-ghost px-2.5"
                aria-label="Next month"
              >
                <span className="-rotate-90">
                  <ChevronDownIcon size={16} />
                </span>
              </Link>
              {!isCurrentMonth && (
                <Link href="/admin/calendar" className="po-btn po-btn-ghost">
                  Today
                </Link>
              )}
              <div className="ml-2 text-base font-semibold tracking-tight text-ink-900">
                {monthLabel}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px] text-ink-500">
              <div className="flex items-center gap-3">
                <LegendDot tone="brand" label="Confirmed" />
                <LegendDot tone="warning" label="Pending" />
                <LegendDot tone="success" label="Completed" />
                <LegendDot tone="neutral" label="Cancelled" />
              </div>
              <div className="hidden h-4 w-px bg-ink-200 sm:block" />
              <div className="flex items-center gap-3">
                <span>
                  <span className="font-medium text-ink-700">{monthBookings.length}</span> bookings
                </span>
                <span>
                  <span className="font-medium text-ink-700">{fmtCurrency(monthRevenue)}</span> revenue
                </span>
              </div>
            </div>
          </div>

          {/* Weekday header */}
          <div className="grid grid-cols-7 border-b border-ink-100 bg-ink-50/40">
            {weekdayLabels.map((d) => (
              <div
                key={d}
                className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-ink-500"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {grid.flat().map((date, i) => {
              const inMonth = date.getMonth() === month
              const key = ymd(date)
              const dayBookings = (byDate.get(key) || []).slice().sort((a, b) => {
                // Sort: confirmed first, then pending, then completed, then cancelled
                const order: Record<BookingStatus, number> = {
                  confirmed: 0,
                  pending: 1,
                  completed: 2,
                  cancelled: 3,
                }
                return order[a.status] - order[b.status]
              })
              const visible = dayBookings.slice(0, 3)
              const hidden = dayBookings.length - visible.length
              const isToday = key === today

              return (
                <div
                  key={i}
                  className={`min-h-[110px] border-b border-r border-ink-100 p-1.5 last:border-r-0 ${
                    inMonth ? 'bg-white' : 'bg-ink-50/40'
                  } ${(i + 1) % 7 === 0 ? 'border-r-0' : ''}`}
                >
                  <div className="mb-1 flex items-center justify-between px-1">
                    <span
                      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-medium ${
                        isToday
                          ? 'bg-brand-600 text-white'
                          : inMonth
                            ? 'text-ink-700'
                            : 'text-ink-400'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {dayBookings.length > 0 && (
                      <span className="text-[10px] text-ink-400">{dayBookings.length}</span>
                    )}
                  </div>

                  <div className="space-y-1">
                    {visible.map((b) => {
                      const isStart = b.start_date === key
                      const style = STATUS_STYLE[b.status]
                      return (
                        <Link
                          key={`${b.id}-${key}`}
                          href={`/admin/bookings/${b.id}`}
                          className={`flex items-center gap-1.5 truncate rounded-md px-1.5 py-1 text-[11px] font-medium transition ${style.bar}`}
                          title={`${b.customer_name} - ${b.product?.name || 'Booking'} (${b.status})`}
                        >
                          {isStart && (
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
                          )}
                          <span className="truncate">
                            {b.customer_name || b.product?.name || 'Booking'}
                          </span>
                        </Link>
                      )
                    })}
                    {hidden > 0 && (
                      <div className="px-1.5 text-[10px] font-medium text-ink-500">
                        +{hidden} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {bookings.length > 0 && <UpcomingList bookings={bookings} today={today} />}
    </>
  )
}

function LegendDot({
  tone,
  label,
}: {
  tone: 'brand' | 'warning' | 'success' | 'neutral'
  label: string
}) {
  const cls: Record<typeof tone, string> = {
    brand: 'bg-brand-500',
    warning: 'bg-amber-500',
    success: 'bg-emerald-500',
    neutral: 'bg-ink-400',
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${cls[tone]}`} />
      {label}
    </span>
  )
}

function UpcomingList({
  bookings,
  today,
}: {
  bookings: BookingWithProduct[]
  today: string
}) {
  const upcoming = bookings
    .filter((b) => b.end_date >= today && b.status !== 'cancelled')
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .slice(0, 6)

  if (upcoming.length === 0) return null

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-900">Next up</h2>
        <Link
          href="/admin/bookings"
          className="text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          View all bookings
        </Link>
      </div>
      <div className="po-card divide-y divide-ink-100">
        {upcoming.map((b) => (
          <Link
            key={b.id}
            href={`/admin/bookings/${b.id}`}
            className="flex items-center gap-4 px-4 py-3 transition hover:bg-ink-50/60"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-ink-900">
                  {b.customer_name}
                </span>
                <StatusBadge status={b.status} />
              </div>
              <div className="mt-0.5 truncate text-xs text-ink-500">
                {b.product?.name} · {fmtDateMedium(b.start_date)}
                {b.end_date !== b.start_date ? ` - ${fmtDateMedium(b.end_date)}` : ''}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-ink-900">
                {fmtCurrency(Number(b.total_price || 0))}
              </div>
              {b.payment_status && (
                <div className="mt-0.5">
                  <Badge tone={b.payment_status === 'paid' ? 'success' : 'warning'}>
                    {b.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                  </Badge>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
