import type { ReactNode } from 'react'

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'

const TONE: Record<Tone, string> = {
  neutral: 'bg-ink-100 text-ink-700 border-ink-200',
  brand: 'bg-brand-50 text-brand-700 border-brand-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
}

export function Badge({
  children,
  tone = 'neutral',
  dot = false,
  className = '',
}: {
  children: ReactNode
  tone?: Tone
  dot?: boolean
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${TONE[tone]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOT[tone]}`} />}
      {children}
    </span>
  )
}

const DOT: Record<Tone, string> = {
  neutral: 'bg-ink-400',
  brand: 'bg-brand-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-sky-500',
}

// ---------------------------------------------------------------------------
// Payment state
//
// `payment_status` only knows unpaid / paid / refunded. When a business takes a
// deposit, the webhook still writes 'paid' even though a balance is outstanding.
// The real picture lives in deposit_amount / balance_amount / balance_paid_at.
// `paymentState` is the single source of truth that every view derives from, so
// the bookings list, calendar and detail page never disagree.
// ---------------------------------------------------------------------------

export type PaymentState = 'paid' | 'deposit' | 'unpaid' | 'refunded'

type PaymentFields = {
  payment_status?: string | null
  balance_amount?: number | null
  balance_paid_at?: string | null
}

export function paymentState(b: PaymentFields): PaymentState {
  const status = b.payment_status || 'unpaid'
  const balanceOwed = Number(b.balance_amount || 0) > 0 && !b.balance_paid_at

  if (status === 'refunded') return 'refunded'
  if (status === 'paid') return balanceOwed ? 'deposit' : 'paid'
  return 'unpaid'
}

const PAYMENT_VIEW: Record<PaymentState, { tone: Tone; label: string }> = {
  paid: { tone: 'success', label: 'Paid' },
  deposit: { tone: 'info', label: 'Deposit paid' },
  unpaid: { tone: 'warning', label: 'Unpaid' },
  refunded: { tone: 'neutral', label: 'Refunded' },
}

export function PaymentBadge({ booking, dot = false }: { booking: PaymentFields; dot?: boolean }) {
  const view = PAYMENT_VIEW[paymentState(booking)]
  return (
    <Badge tone={view.tone} dot={dot}>
      {view.label}
    </Badge>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: Tone; label: string }> = {
    pending: { tone: 'warning', label: 'New' },
    confirmed: { tone: 'brand', label: 'Confirmed' },
    completed: { tone: 'success', label: 'Completed' },
    cancelled: { tone: 'neutral', label: 'Cancelled' },
    paid: { tone: 'success', label: 'Paid' },
    unpaid: { tone: 'warning', label: 'Unpaid' },
    refunded: { tone: 'neutral', label: 'Refunded' },
    draft: { tone: 'neutral', label: 'Draft' },
    sent: { tone: 'info', label: 'Sent' },
    overdue: { tone: 'danger', label: 'Overdue' },
  }
  const info = map[status] || { tone: 'neutral' as Tone, label: status }
  return (
    <Badge tone={info.tone} dot>
      {info.label}
    </Badge>
  )
}
