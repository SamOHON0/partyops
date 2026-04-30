import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase'
import { getCustomers } from '@/lib/api/customers'
import { PageHeader, EmptyState } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import {
  UsersIcon,
  SearchIcon,
  ArrowRightIcon,
  MailIcon,
  PhoneIcon,
} from '@/components/ui/Icon'
import { fmtCurrency, fmtDateMedium, relativeDays } from '@/lib/format'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ q?: string; sort?: string }>

export default async function CustomersPage({
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

  const customers = await getCustomers(user.id)
  const query = (params.q || '').trim().toLowerCase()
  const sort = params.sort || 'recent'

  const filtered = customers.filter((c) => {
    if (!query) return true
    const hay = [c.name, c.email, c.phone, c.address].filter(Boolean).join(' ').toLowerCase()
    return hay.includes(query)
  })

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case 'value':
        return b.lifetime_value - a.lifetime_value
      case 'bookings':
        return b.bookings_count - a.bookings_count
      case 'name':
        return a.name.localeCompare(b.name)
      case 'recent':
      default:
        return b.last_booking_date.localeCompare(a.last_booking_date)
    }
  })

  const totalValue = customers.reduce((s, c) => s + c.lifetime_value, 0)
  const repeatCount = customers.filter((c) => c.bookings_count > 1).length

  const sortOptions = [
    { value: 'recent', label: 'Most recent' },
    { value: 'value', label: 'Highest value' },
    { value: 'bookings', label: 'Most bookings' },
    { value: 'name', label: 'Name A-Z' },
  ]

  return (
    <>
      <PageHeader
        title="Customers"
        description="Everyone who's ever booked with you. Spot regulars, track lifetime value, and stay in touch."
      />

      {customers.length === 0 ? (
        <EmptyState
          icon={<UsersIcon size={22} />}
          title="No customers yet"
          description="Your customers will appear here automatically as bookings come in."
        />
      ) : (
        <>
          {/* Stats */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Total customers" value={String(customers.length)} />
            <StatTile label="Repeat customers" value={String(repeatCount)} />
            <StatTile label="Lifetime revenue" value={fmtCurrency(totalValue)} />
            <StatTile
              label="Avg. per customer"
              value={fmtCurrency(
                customers.length ? Math.round(totalValue / customers.length) : 0,
              )}
            />
          </div>

          {/* Controls */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <form className="relative w-full sm:max-w-xs" action="/admin/customers" method="get">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-400">
                <SearchIcon size={15} />
              </div>
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Search name, email, phone..."
                className="po-input pl-9"
              />
              {sort !== 'recent' && <input type="hidden" name="sort" value={sort} />}
            </form>

            <div className="flex items-center gap-1 text-xs">
              <span className="text-ink-400">Sort:</span>
              {sortOptions.map((opt) => {
                const active = sort === opt.value
                const qs = new URLSearchParams()
                if (opt.value !== 'recent') qs.set('sort', opt.value)
                if (query) qs.set('q', query)
                const href = qs.toString() ? `/admin/customers?${qs}` : '/admin/customers'
                return (
                  <Link
                    key={opt.value}
                    href={href}
                    className={`rounded-lg px-2 py-1 font-medium transition ${
                      active
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                    }`}
                  >
                    {opt.label}
                  </Link>
                )
              })}
            </div>
          </div>

          {sorted.length === 0 ? (
            <EmptyState
              icon={<SearchIcon size={22} />}
              title="No customers match"
              description="Try a different search."
              action={
                <Link href="/admin/customers" className="po-btn po-btn-secondary">
                  Clear search
                </Link>
              }
            />
          ) : (
            <div className="po-card overflow-hidden">
              <div className="hidden border-b border-ink-100 bg-ink-50/40 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500 sm:grid sm:grid-cols-[1.8fr_1.6fr_0.7fr_0.9fr_0.9fr_auto] sm:gap-4">
                <div>Customer</div>
                <div>Contact</div>
                <div className="text-right">Bookings</div>
                <div className="text-right">Lifetime value</div>
                <div>Last booked</div>
                <div className="sr-only">View</div>
              </div>

              <ul className="divide-y divide-ink-100">
                {sorted.map((c) => {
                  const initials = (c.name || c.email || '?')
                    .split(/\s+/)
                    .map((w) => w[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()
                  const href = `/admin/customers/${c.key}`

                  return (
                    <li key={c.key} className="px-4 py-3 transition hover:bg-ink-50/40 sm:grid sm:grid-cols-[1.8fr_1.6fr_0.7fr_0.9fr_0.9fr_auto] sm:items-center sm:gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-semibold text-white">
                          {initials || 'G'}
                        </div>
                        <div className="min-w-0">
                          <Link href={href} className="truncate text-sm font-semibold text-ink-900 hover:text-brand-700">
                            {c.name || 'Unknown'}
                          </Link>
                          {c.bookings_count > 1 && (
                            <Badge tone="brand" className="ml-2 align-middle">
                              Repeat
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="mt-1 min-w-0 text-xs text-ink-600 sm:mt-0">
                        {c.email && (
                          <div className="flex items-center gap-1.5 truncate">
                            <MailIcon size={12} />
                            <span className="truncate">{c.email}</span>
                          </div>
                        )}
                        {c.phone && (
                          <div className="flex items-center gap-1.5 truncate text-ink-500">
                            <PhoneIcon size={12} />
                            <span className="truncate">{c.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-1 text-sm sm:mt-0 sm:text-right">
                        <span className="font-semibold text-ink-900">{c.bookings_count}</span>
                      </div>

                      <div className="text-sm sm:text-right">
                        <span className="font-semibold text-ink-900">
                          {fmtCurrency(c.lifetime_value)}
                        </span>
                      </div>

                      <div className="mt-1 text-xs text-ink-600 sm:mt-0">
                        <div>{fmtDateMedium(c.last_booking_date)}</div>
                        <div className="text-[10px] text-ink-400">
                          {relativeDays(c.last_booking_date)}
                        </div>
                      </div>

                      <div className="mt-2 sm:mt-0 sm:text-right">
                        <Link
                          href={href}
                          className="po-btn po-btn-ghost px-2 py-1 text-xs"
                          aria-label="View customer"
                        >
                          <ArrowRightIcon size={14} />
                        </Link>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          <div className="mt-3 text-xs text-ink-400">
            Showing <span className="font-medium text-ink-600">{sorted.length}</span> of{' '}
            {customers.length} customers
          </div>
        </>
      )}
    </>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="po-card p-4">
      <div className="text-[11px] font-medium uppercase tracking-wider text-ink-500">{label}</div>
      <div className="mt-1 text-xl font-semibold tracking-tight text-ink-900">{value}</div>
    </div>
  )
}
