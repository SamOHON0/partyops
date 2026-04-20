import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase'
import { getInvoices, isOverdue } from '@/lib/api/invoices'
import { PageHeader, EmptyState } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/Badge'
import {
  InvoiceIcon,
  PlusIcon,
  ArrowRightIcon,
  SearchIcon,
} from '@/components/ui/Icon'
import { fmtCurrency, fmtDateMedium, relativeDays } from '@/lib/format'
import type { Invoice } from '@/lib/types'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ status?: string; q?: string }>

export default async function InvoicesPage({
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

  let invoices: Invoice[] = []
  try {
    invoices = await getInvoices(user.id)
  } catch {
    // table may not exist yet if migration hasn't run
    invoices = []
  }

  const statusFilter = params.status || ''
  const query = (params.q || '').trim().toLowerCase()

  // Compute dynamic status (overdue) on the fly
  const withStatus = invoices.map((inv) => ({
    ...inv,
    displayStatus: inv.status === 'sent' && isOverdue(inv) ? 'overdue' : inv.status,
  }))

  const filtered = withStatus.filter((inv) => {
    if (statusFilter && inv.displayStatus !== statusFilter) return false
    if (query) {
      const hay = [inv.invoice_number, inv.customer_name, inv.customer_email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!hay.includes(query)) return false
    }
    return true
  })

  const totals = {
    outstanding: withStatus
      .filter((i) => i.displayStatus === 'sent' || i.displayStatus === 'overdue')
      .reduce((s, i) => s + Number(i.total || 0), 0),
    paid: withStatus
      .filter((i) => i.displayStatus === 'paid')
      .reduce((s, i) => s + Number(i.total || 0), 0),
    overdue: withStatus
      .filter((i) => i.displayStatus === 'overdue')
      .reduce((s, i) => s + Number(i.total || 0), 0),
    draft: withStatus.filter((i) => i.displayStatus === 'draft').length,
  }

  const counts = {
    all: invoices.length,
    draft: withStatus.filter((i) => i.displayStatus === 'draft').length,
    sent: withStatus.filter((i) => i.displayStatus === 'sent').length,
    overdue: withStatus.filter((i) => i.displayStatus === 'overdue').length,
    paid: withStatus.filter((i) => i.displayStatus === 'paid').length,
  }

  const tabs: { label: string; value: string; count: number }[] = [
    { label: 'All', value: '', count: counts.all },
    { label: 'Draft', value: 'draft', count: counts.draft },
    { label: 'Sent', value: 'sent', count: counts.sent },
    { label: 'Overdue', value: 'overdue', count: counts.overdue },
    { label: 'Paid', value: 'paid', count: counts.paid },
  ]

  function buildHref(overrides: Partial<{ status: string; q: string }>) {
    const merged = { status: statusFilter, q: query, ...overrides }
    const qs = new URLSearchParams()
    if (merged.status) qs.set('status', merged.status)
    if (merged.q) qs.set('q', merged.q)
    const str = qs.toString()
    return str ? `/admin/invoices?${str}` : '/admin/invoices'
  }

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Create and track invoices. Send links, mark them paid, and keep your books tidy."
        actions={
          <Link href="/admin/invoices/new" className="po-btn po-btn-primary">
            <PlusIcon size={16} />
            New invoice
          </Link>
        }
      />

      {invoices.length === 0 ? (
        <EmptyState
          icon={<InvoiceIcon size={22} />}
          title="No invoices yet"
          description="Create your first invoice from a booking or from scratch."
          action={
            <Link href="/admin/invoices/new" className="po-btn po-btn-primary">
              <PlusIcon size={16} />
              Create invoice
            </Link>
          }
        />
      ) : (
        <>
          {/* Stats */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Outstanding"
              value={fmtCurrency(totals.outstanding)}
              tone={totals.outstanding > 0 ? 'brand' : 'neutral'}
            />
            <StatTile
              label="Overdue"
              value={fmtCurrency(totals.overdue)}
              tone={totals.overdue > 0 ? 'danger' : 'neutral'}
            />
            <StatTile label="Paid" value={fmtCurrency(totals.paid)} tone="success" />
            <StatTile label="Drafts" value={String(totals.draft)} tone="neutral" />
          </div>

          {/* Filters */}
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

            <form className="relative w-full sm:max-w-xs" action="/admin/invoices" method="get">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-400">
                <SearchIcon size={15} />
              </div>
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Search number, customer..."
                className="po-input pl-9"
              />
              {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
            </form>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<SearchIcon size={22} />}
              title="No invoices match"
              description="Try a different search or clear your filters."
              action={
                <Link href="/admin/invoices" className="po-btn po-btn-secondary">
                  Clear filters
                </Link>
              }
            />
          ) : (
            <div className="po-card overflow-hidden">
              <div className="hidden border-b border-ink-100 bg-ink-50/40 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500 sm:grid sm:grid-cols-[0.8fr_1.5fr_1fr_0.8fr_0.7fr_auto] sm:gap-4">
                <div>Number</div>
                <div>Customer</div>
                <div>Due</div>
                <div className="text-right">Total</div>
                <div>Status</div>
                <div className="sr-only">Actions</div>
              </div>

              <ul className="divide-y divide-ink-100">
                {filtered.map((inv) => (
                  <li
                    key={inv.id}
                    className="px-4 py-3 transition hover:bg-ink-50/40 sm:grid sm:grid-cols-[0.8fr_1.5fr_1fr_0.8fr_0.7fr_auto] sm:items-center sm:gap-4"
                  >
                    <div className="flex items-center gap-2 sm:gap-0">
                      <Link
                        href={`/admin/invoices/${inv.id}`}
                        className="font-mono text-sm font-semibold text-ink-900 hover:text-brand-700"
                      >
                        {inv.invoice_number}
                      </Link>
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-ink-900">
                        {inv.customer_name}
                      </div>
                      {inv.customer_email && (
                        <div className="truncate text-[11px] text-ink-500">
                          {inv.customer_email}
                        </div>
                      )}
                    </div>

                    <div className="text-sm text-ink-700">
                      <div>{fmtDateMedium(inv.due_date)}</div>
                      <div className="text-[11px] text-ink-500">
                        {relativeDays(inv.due_date)}
                      </div>
                    </div>

                    <div className="text-sm font-semibold text-ink-900 sm:text-right">
                      {fmtCurrency(Number(inv.total || 0))}
                    </div>

                    <div>
                      <StatusBadge status={inv.displayStatus} />
                    </div>

                    <div className="mt-2 sm:mt-0 sm:text-right">
                      <Link
                        href={`/admin/invoices/${inv.id}`}
                        className="po-btn po-btn-ghost px-2 py-1 text-xs"
                        aria-label="View invoice"
                      >
                        <ArrowRightIcon size={14} />
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3 text-xs text-ink-400">
            Showing <span className="font-medium text-ink-600">{filtered.length}</span> of{' '}
            {invoices.length} invoices
          </div>
        </>
      )}
    </>
  )
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'brand' | 'success' | 'danger' | 'neutral'
}) {
  const dot: Record<typeof tone, string> = {
    brand: 'bg-brand-500',
    success: 'bg-emerald-500',
    danger: 'bg-rose-500',
    neutral: 'bg-ink-300',
  }
  return (
    <div className="po-card p-4">
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${dot[tone]}`} />
        <span className="text-[11px] font-medium uppercase tracking-wider text-ink-500">
          {label}
        </span>
      </div>
      <div className="mt-1 text-xl font-semibold tracking-tight text-ink-900">{value}</div>
    </div>
  )
}
