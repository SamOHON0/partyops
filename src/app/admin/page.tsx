import Link from 'next/link'
import { createServerComponentClient } from '@/lib/supabase'
import { getBookings } from '@/lib/api/bookings'
import { getProducts } from '@/lib/api/products'
import { BookingWithProduct } from '@/lib/types'
import { PageHeader, EmptyState } from '@/components/ui/PageHeader'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { fmtCurrency, fmtCurrencyFull, fmtDateMedium } from '@/lib/format'
import {
  ArrowRightIcon,
  PlusIcon,
  TrendingUpIcon,
  BookingsIcon,
  UsersIcon,
  InventoryIcon,
  CalendarIcon,
  EuroIcon,
  BoltIcon,
} from '@/components/ui/Icon'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// Format a local Date as YYYY-MM-DD. Using toISOString() here would convert
// to UTC and can shift the day on month boundaries when the server TZ is
// behind UTC, causing stats to miss bookings at the edges.
function ymdLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function computeStats(bookings: BookingWithProduct[]) {
  const now = new Date()
  const today = ymdLocal(now)
  const thisMonthStart = ymdLocal(new Date(now.getFullYear(), now.getMonth(), 1))
  const lastMonthStart = ymdLocal(new Date(now.getFullYear(), now.getMonth() - 1, 1))
  const lastMonthEnd = ymdLocal(new Date(now.getFullYear(), now.getMonth(), 0))

  const counted = bookings.filter((b) => b.status !== 'cancelled')
  const pending = bookings.filter((b) => b.status === 'pending')
  const active = bookings.filter((b) => b.status === 'pending' || b.status === 'confirmed')
  const outToday = active.filter((b) => b.start_date <= today && b.end_date >= today)
  const upcoming = active
    .filter((b) => b.start_date > today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))

  const thisMonthRevenue = counted
    .filter((b) => b.created_at.slice(0, 10) >= thisMonthStart)
    .reduce((s, b) => s + Number(b.total_price || 0), 0)
  const lastMonthRevenue = counted
    .filter((b) => b.created_at.slice(0, 10) >= lastMonthStart && b.created_at.slice(0, 10) <= lastMonthEnd)
    .reduce((s, b) => s + Number(b.total_price || 0), 0)
  const revenueChange =
    lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : thisMonthRevenue > 0
      ? 100
      : 0

  const thisMonthCount = counted.filter((b) => b.created_at.slice(0, 10) >= thisMonthStart).length
  const lastMonthCount = counted.filter(
    (b) => b.created_at.slice(0, 10) >= lastMonthStart && b.created_at.slice(0, 10) <= lastMonthEnd,
  ).length
  const bookingChange =
    lastMonthCount > 0
      ? Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100)
      : thisMonthCount > 0
      ? 100
      : 0

  const monthly: { label: string; count: number; revenue: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const start = ymdLocal(d)
    const end = ymdLocal(new Date(d.getFullYear(), d.getMonth() + 1, 0))
    const slice = counted.filter(
      (b) => b.created_at.slice(0, 10) >= start && b.created_at.slice(0, 10) <= end,
    )
    monthly.push({
      label: d.toLocaleDateString('en-IE', { month: 'short' }),
      count: slice.length,
      revenue: slice.reduce((s, b) => s + Number(b.total_price || 0), 0),
    })
  }

  const itemStats: Record<string, { name: string; count: number; revenue: number }> = {}
  counted.forEach((b) => {
    const name = b.product?.name || 'Unknown'
    if (!itemStats[name]) itemStats[name] = { name, count: 0, revenue: 0 }
    itemStats[name].count++
    itemStats[name].revenue += Number(b.total_price || 0)
  })
  const topItems = Object.values(itemStats).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  const customerSet = new Set<string>()
  bookings.forEach((b) => {
    if (b.email) customerSet.add(b.email.toLowerCase())
  })

  const confirmationRate =
    bookings.length > 0
      ? Math.round(
          (bookings.filter((b) => b.status !== 'pending' && b.status !== 'cancelled').length /
            bookings.length) *
            100,
        )
      : 0

  return {
    pending,
    outToday,
    upcoming: upcoming.slice(0, 6),
    monthly,
    thisMonthRevenue,
    revenueChange,
    thisMonthCount,
    bookingChange,
    topItems,
    customersCount: customerSet.size,
    confirmationRate,
  }
}

export default async function AdminDashboard() {
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [bookings, products] = await Promise.all([getBookings(user.id), getProducts(user.id)])
  const s = computeStats(bookings)
  const maxMonthly = Math.max(...s.monthly.map((m) => m.revenue), 1)

  return (
    <div>
      <PageHeader
        title={`${getGreeting()}.`}
        description="Here is how your business is doing this month."
        actions={
          <>
            <Link href="/admin/bookings/new" className="po-btn po-btn-secondary">
              <PlusIcon size={15} /> New booking
            </Link>
            <Link href="/admin/products/new" className="po-btn po-btn-primary">
              <PlusIcon size={15} /> New item
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Revenue this month"
          value={fmtCurrency(s.thisMonthRevenue)}
          change={s.revenueChange}
          icon={<EuroIcon size={16} />}
          href="/admin/bookings"
        />
        <MetricCard
          label="New bookings"
          value={String(s.thisMonthCount)}
          change={s.bookingChange}
          icon={<BookingsIcon size={16} />}
          href="/admin/bookings"
        />
        <MetricCard
          label="Awaiting confirmation"
          value={String(s.pending.length)}
          icon={<BoltIcon size={16} />}
          href="/admin/bookings?status=pending"
          tone={s.pending.length > 0 ? 'warning' : 'neutral'}
        />
        <MetricCard
          label="Customers"
          value={String(s.customersCount)}
          icon={<UsersIcon size={16} />}
          href="/admin/customers"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="po-card p-5 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Revenue trend</div>
              <div className="text-xs text-ink-500">Last 6 months</div>
            </div>
            <Badge tone="brand" dot>
              <TrendingUpIcon size={12} /> {fmtCurrencyFull(s.monthly.reduce((sum, m) => sum + m.revenue, 0))} total
            </Badge>
          </div>
          <div className="flex h-48 items-end gap-3">
            {s.monthly.map((m, i) => {
              const height = Math.max((m.revenue / maxMonthly) * 100, 4)
              const isLast = i === s.monthly.length - 1
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className={`w-full rounded-t-md ${isLast ? 'bg-brand-500' : 'bg-brand-200'}`}
                      style={{ height: `${height}%` }}
                      title={`${m.label}: ${fmtCurrencyFull(m.revenue)} (${m.count} bookings)`}
                    />
                  </div>
                  <div className="text-[10px] font-medium text-ink-500">{m.label}</div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-ink-100 pt-4 text-xs">
            <MiniStat label="Confirmation rate" value={`${s.confirmationRate}%`} />
            <MiniStat label="Items in catalogue" value={String(products.length)} />
            <MiniStat label="Out today" value={String(s.outToday.length)} />
          </div>
        </div>

        <div className="po-card flex flex-col">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5">
            <div className="text-sm font-semibold">Top items</div>
            <Link href="/admin/products" className="text-xs font-medium text-brand-600 hover:text-brand-700">
              See all
            </Link>
          </div>
          {s.topItems.length === 0 ? (
            <div className="flex flex-1 items-center justify-center px-5 py-10 text-sm text-ink-500">
              No bookings yet
            </div>
          ) : (
            <ul className="divide-y divide-ink-100">
              {s.topItems.map((t, i) => {
                const pct = s.topItems[0].revenue > 0 ? (t.revenue / s.topItems[0].revenue) * 100 : 0
                return (
                  <li key={t.name} className="px-5 py-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-ink-900">
                        <span className="text-[10px] font-semibold text-ink-400">#{i + 1}</span>
                        <span className="font-medium">{t.name}</span>
                      </span>
                      <span className="text-sm font-semibold">{fmtCurrency(t.revenue)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
                        <div className="h-full bg-brand-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[11px] text-ink-500">{t.count}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ListCard
          title="Out today"
          empty="Nothing booked out today. Enjoy the quiet."
          emptyIcon={<CalendarIcon size={18} />}
          items={s.outToday}
        />
        <ListCard
          title="Upcoming"
          empty="No upcoming bookings yet."
          emptyIcon={<BookingsIcon size={18} />}
          items={s.upcoming}
          action={
            <Link href="/admin/bookings" className="text-xs font-medium text-brand-600 hover:text-brand-700">
              See all <ArrowRightIcon size={12} className="inline" />
            </Link>
          }
        />
      </div>

      {products.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={<InventoryIcon size={22} />}
            title="Add your first item"
            description="Before customers can book, you need at least one item in your catalogue. Photos, prices, quantities. Takes two minutes."
            action={
              <Link href="/admin/products/new" className="po-btn po-btn-primary">
                Add an item <ArrowRightIcon size={15} />
              </Link>
            }
          />
        </div>
      )}
    </div>
  )
}

function MetricCard({
  label,
  value,
  change,
  icon,
  href,
  tone = 'neutral',
}: {
  label: string
  value: string
  change?: number
  icon: React.ReactNode
  href?: string
  tone?: 'neutral' | 'warning'
}) {
  const body = (
    <div
      className={`po-card group relative h-full p-4 transition hover:border-ink-300 ${
        tone === 'warning' ? 'ring-1 ring-amber-200' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-ink-500">{label}</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-50 text-ink-500">
          {icon}
        </span>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-ink-900">{value}</div>
      {typeof change === 'number' && (
        <div className={`mt-1 text-[11px] font-medium ${change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {change >= 0 ? '+' : ''}
          {change}% vs last month
        </div>
      )}
    </div>
  )
  return href ? <Link href={href}>{body}</Link> : body
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-wider text-ink-500">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-ink-900">{value}</div>
    </div>
  )
}

function ListCard({
  title,
  empty,
  emptyIcon,
  items,
  action,
}: {
  title: string
  empty: string
  emptyIcon?: React.ReactNode
  items: BookingWithProduct[]
  action?: React.ReactNode
}) {
  return (
    <div className="po-card">
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5">
        <div className="text-sm font-semibold">{title}</div>
        {action}
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-5 py-10 text-center">
          {emptyIcon && <div className="text-ink-400">{emptyIcon}</div>}
          <div className="text-sm text-ink-500">{empty}</div>
        </div>
      ) : (
        <ul className="divide-y divide-ink-100">
          {items.map((b) => (
            <li key={b.id} className="flex items-center justify-between px-5 py-3">
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium text-ink-900">{b.customer_name}</div>
                <div className="truncate text-[11px] text-ink-500">
                  {b.product?.name} &middot; {fmtDateMedium(b.start_date)}
                  {b.start_date !== b.end_date && <> → {fmtDateMedium(b.end_date)}</>}
                </div>
              </div>
              <StatusBadge status={b.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
