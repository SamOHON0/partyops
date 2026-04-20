'use client'

import { useEffect, useMemo, useState } from 'react'

type Product = {
  id: string
  name: string
  description: string | null
  price_per_day: number
  image_url: string | null
  quantity_available: number
  delivery_fee: number | null
}

type Step = 'pick' | 'details' | 'done'

export default function BookingWidget({
  businessId,
  businessName,
  products,
  paymentInstructions,
  paymentLink,
  stripeEnabled = false,
}: {
  businessId: string
  businessName: string
  products: Product[]
  paymentInstructions: string | null
  paymentLink: string | null
  stripeEnabled?: boolean
}) {
  const [step, setStep] = useState<Step>('pick')
  const [selected, setSelected] = useState<Product | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [availability, setAvailability] = useState<{
    checking: boolean
    available: boolean | null
    remaining: number | null
    error: string | null
  }>({ checking: false, available: null, remaining: null, error: null })
  const [form, setForm] = useState({ customer_name: '', email: '', phone: '', address: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [loadingPayment, setLoadingPayment] = useState(false)

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const days = useMemo(() => {
    if (!startDate || !endDate) return 0
    return Math.max(
      0,
      Math.round(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000,
      ) + 1,
    )
  }, [startDate, endDate])
  const total = useMemo(() => {
    if (!selected || days <= 0) return 0
    return selected.price_per_day * days + (selected.delivery_fee || 0)
  }, [selected, days])

  useEffect(() => {
    if (!selected || !startDate || !endDate) {
      setAvailability({ checking: false, available: null, remaining: null, error: null })
      return
    }
    let cancelled = false
    setAvailability((s) => ({ ...s, checking: true, error: null }))
    fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: selected.id,
        start_date: startDate,
        end_date: endDate,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        if (d.error)
          setAvailability({
            checking: false,
            available: false,
            remaining: 0,
            error: d.error,
          })
        else
          setAvailability({
            checking: false,
            available: !!d.available,
            remaining: d.remaining ?? 0,
            error: null,
          })
      })
      .catch(() => {
        if (!cancelled)
          setAvailability({
            checking: false,
            available: false,
            remaining: 0,
            error: 'check failed',
          })
      })
    return () => {
      cancelled = true
    }
  }, [selected, startDate, endDate])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          product_id: selected.id,
          start_date: startDate,
          end_date: endDate,
          ...form,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Booking failed')
      if (data.booking?.id) setBookingId(data.booking.id)
      setStep('done')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Booking failed')
    } finally {
      setSubmitting(false)
    }
  }

  const stepIndex = step === 'pick' ? 0 : step === 'details' ? 1 : 2
  const initials = businessName
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-screen bg-white font-sans antialiased text-ink-900">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-md shadow-brand-500/20">
            <span className="text-sm font-semibold text-white">{initials || 'P'}</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">
            {businessName}
          </h1>
          <p className="mt-1 text-sm text-ink-500">Book in under a minute</p>

          {/* Progress */}
          <div className="mt-6 flex items-center justify-center gap-0">
            {[
              { label: 'Choose', i: 0 },
              { label: 'Details', i: 1 },
              { label: 'Done', i: 2 },
            ].map(({ label, i }) => (
              <div key={i} className="flex items-center">
                {i > 0 && (
                  <div
                    className={`h-px w-10 transition-colors sm:w-14 ${
                      stepIndex >= i ? 'bg-brand-500' : 'bg-ink-200'
                    }`}
                  />
                )}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold transition-all ${
                      stepIndex > i
                        ? 'bg-emerald-500 text-white'
                        : stepIndex === i
                          ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
                          : 'bg-ink-100 text-ink-400'
                    }`}
                  >
                    {stepIndex > i ? '\u2713' : i + 1}
                  </div>
                  <span
                    className={`text-[10px] font-medium ${
                      stepIndex === i ? 'text-brand-700' : 'text-ink-400'
                    }`}
                  >
                    {label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </header>

        {/* STEP: Done */}
        {step === 'done' && (
          <div className="rounded-2xl border border-ink-200 bg-white p-8 text-center shadow-sm sm:p-10">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg
                className="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-ink-900">Booking request sent</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500">
              {businessName} will be in touch shortly to confirm the details.
            </p>

            {/* Stripe payment */}
            {stripeEnabled && bookingId && (
              <div className="mx-auto mt-6 max-w-sm">
                <button
                  onClick={async () => {
                    setLoadingPayment(true)
                    try {
                      const res = await fetch('/api/stripe/checkout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ booking_id: bookingId }),
                      })
                      const data = await res.json()
                      if (data.url) {
                        if (window.top !== window.self) {
                          window.open(data.url, '_blank')
                        } else {
                          window.location.href = data.url
                        }
                      }
                    } catch {
                      /* ignore */
                    } finally {
                      setLoadingPayment(false)
                    }
                  }}
                  disabled={loadingPayment}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
                >
                  {loadingPayment ? 'Loading...' : 'Pay with card'}
                </button>
                <p className="mt-2 text-center text-[10px] text-ink-400">
                  Secure payment via Stripe
                </p>
              </div>
            )}

            {/* Manual payment */}
            {(paymentInstructions || paymentLink) && (
              <div
                className={`mx-auto ${stripeEnabled && bookingId ? 'mt-4' : 'mt-6'} max-w-sm rounded-2xl border border-ink-200 bg-ink-50/50 p-5 text-left`}
              >
                <h3 className="text-sm font-semibold text-ink-900">
                  {stripeEnabled ? 'Or pay by transfer' : 'How to pay'}
                </h3>
                {paymentInstructions && (
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-700">
                    {paymentInstructions}
                  </p>
                )}
                {paymentLink && (
                  <a
                    href={paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Pay now
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP: Pick */}
        {step === 'pick' && (
          <div className="space-y-6">
            <h2 className="text-sm font-semibold text-ink-800">Pick an item</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {products.map((p) => {
                const active = selected?.id === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelected(p)}
                    className={`group overflow-hidden rounded-2xl border text-left transition-all ${
                      active
                        ? 'border-brand-500 shadow-md shadow-brand-500/10'
                        : 'border-ink-200 hover:border-ink-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-100">
                      {p.image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-ink-300">
                          <svg
                            width="36"
                            height="36"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path d="M21 8 12 3 3 8v8l9 5 9-5V8z" />
                            <path d="m3 8 9 5 9-5M12 13v8" />
                          </svg>
                        </div>
                      )}
                      {active && (
                        <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 shadow-md">
                          <svg
                            className="h-3.5 w-3.5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="bg-white p-4">
                      <div className="text-sm font-semibold text-ink-900">{p.name}</div>
                      {p.description && (
                        <div className="mt-1 line-clamp-2 text-xs text-ink-500">
                          {p.description}
                        </div>
                      )}
                      <div className="mt-2 inline-flex items-baseline gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-sm font-semibold text-brand-700">
                        €{p.price_per_day}
                        <span className="text-[11px] font-normal text-brand-500">/day</span>
                      </div>
                    </div>
                  </button>
                )
              })}
              {products.length === 0 && (
                <div className="col-span-full rounded-2xl border border-ink-200 bg-white py-10 text-center">
                  <div className="text-sm text-ink-500">
                    No items available right now. Please check back soon.
                  </div>
                </div>
              )}
            </div>

            {selected && (
              <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold text-ink-800">When do you need it?</h3>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                      Start
                    </span>
                    <input
                      type="date"
                      min={today}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="mt-1.5 block w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                      End
                    </span>
                    <input
                      type="date"
                      min={startDate || today}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="mt-1.5 block w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </label>
                </div>

                <div className="mt-4 min-h-[48px]">
                  {!startDate || !endDate ? (
                    <div className="text-xs text-ink-500">
                      Pick your dates to check availability
                    </div>
                  ) : availability.checking ? (
                    <div className="flex items-center gap-2 text-xs text-ink-500">
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth={4}
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>
                      Checking...
                    </div>
                  ) : availability.available ? (
                    <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Available
                      </div>
                      <div className="text-right">
                        <div className="text-base font-semibold text-ink-900">
                          €{total.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-ink-500">
                          {days} day{days !== 1 ? 's' : ''}
                          {selected.delivery_fee ? ' incl. delivery' : ''}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                      Not available for those dates. Try different dates.
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!availability.available || availability.checking}
                  onClick={() => setStep('details')}
                  className="mt-5 w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-ink-200 disabled:text-ink-400"
                >
                  Continue to details
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP: Details */}
        {step === 'details' && selected && (
          <form onSubmit={submit} className="space-y-4">
            <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                {selected.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={selected.image_url}
                    alt={selected.name}
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-ink-100 text-ink-300">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M21 8 12 3 3 8v8l9 5 9-5V8z" />
                    </svg>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-ink-900">{selected.name}</div>
                  <div className="mt-0.5 text-xs text-ink-500">
                    {fmtDate(startDate)} to {fmtDate(endDate)}
                  </div>
                  <div className="text-[11px] text-ink-400">
                    {days} day{days !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-brand-700">€{total.toFixed(2)}</div>
                  <div className="text-[10px] text-ink-400">total</div>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-ink-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-ink-800">Your details</h3>
              <WInput
                label="Full name"
                type="text"
                value={form.customer_name}
                onChange={(v) => setForm({ ...form, customer_name: v })}
                placeholder="Jane Doe"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <WInput
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(v) => setForm({ ...form, email: v })}
                  placeholder="jane@example.com"
                />
                <WInput
                  label="Phone"
                  type="tel"
                  value={form.phone}
                  onChange={(v) => setForm({ ...form, phone: v })}
                  placeholder="08X XXX XXXX"
                />
              </div>
              <WInput
                label="Delivery address"
                type="text"
                value={form.address}
                onChange={(v) => setForm({ ...form, address: v })}
                placeholder="123 Main St, Dublin"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('pick')}
                className="flex-1 rounded-xl border border-ink-200 bg-white py-3 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-[2] rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:bg-ink-200 disabled:text-ink-400"
              >
                {submitting ? 'Sending...' : 'Request booking'}
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="mt-10 flex items-center justify-center gap-1.5 text-[10px] text-ink-400">
          Powered by{' '}
          <a
            href="https://partyops.io"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-ink-500 hover:text-brand-700"
          >
            PartyOps
          </a>
        </div>
      </div>
    </div>
  )
}

function WInput({
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
        {label}
      </span>
      <input
        required
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      />
    </label>
  )
}

function fmtDate(s: string) {
  if (!s) return ''
  return new Date(s).toLocaleDateString('en-IE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}
