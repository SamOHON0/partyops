'use client'

import { useEffect, useMemo, useState } from 'react'
import type { BookingQuestion } from '@/lib/types'

type Product = {
  id: string
  name: string
  description: string | null
  price_per_day: number
  image_url: string | null
  quantity_available: number
  delivery_fee: number | null
  slug?: string | null
  price_on_request?: boolean
}

type Step = 'pick' | 'details' | 'done'

export default function BookingWidget({
  businessId,
  businessName,
  businessEmail = null,
  businessPhone = null,
  products,
  paymentInstructions,
  paymentLink,
  stripeEnabled = false,
  preselectProductId = null,
  depositPercentage = 0,
  paymentRequired = false,
  termsEnabled = false,
  termsText = null,
  termsUrl = null,
  questions = [],
}: {
  businessId: string
  businessName: string
  businessEmail?: string | null
  businessPhone?: string | null
  products: Product[]
  paymentInstructions: string | null
  paymentLink: string | null
  stripeEnabled?: boolean
  preselectProductId?: string | null
  depositPercentage?: number
  paymentRequired?: boolean
  termsEnabled?: boolean
  termsText?: string | null
  termsUrl?: string | null
  questions?: BookingQuestion[]
}) {
  // If the embed page resolved ?item=<slug> to a real product, start with it
  // selected. Customer still sees the picker grid but their chosen item is
  // highlighted and ready to confirm.
  const initialSelected = useMemo(
    () => products.find((p) => p.id === preselectProductId) ?? null,
    [preselectProductId, products],
  )

  const [step, setStep] = useState<Step>('pick')
  const [selected, setSelected] = useState<Product | null>(initialSelected)
  // Picker grid is collapsed by default when arriving from a deep link
  // (customer already chose on the product page). They can expand to browse.
  const [pickerOpen, setPickerOpen] = useState<boolean>(!initialSelected)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [availability, setAvailability] = useState<{
    checking: boolean
    available: boolean | null
    remaining: number | null
    error: string | null
  }>({ checking: false, available: null, remaining: null, error: null })
  const [form, setForm] = useState({ customer_name: '', email: '', phone: '', address: '' })
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [payFull, setPayFull] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [loadingPayment, setLoadingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

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
  const depositPctClamped = Math.max(0, Math.min(100, depositPercentage || 0))
  const isDepositMode = depositPctClamped > 0 && depositPctClamped < 100 && stripeEnabled
  const total = useMemo(() => {
    if (!selected || days <= 0) return 0
    return selected.price_per_day * days + (selected.delivery_fee || 0)
  }, [selected, days])
  const depositAmount = useMemo(
    () => (isDepositMode ? Math.round(total * (depositPctClamped / 100) * 100) / 100 : total),
    [total, depositPctClamped, isDepositMode],
  )
  const balanceAmount = useMemo(
    () => (isDepositMode ? Math.round((total - depositAmount) * 100) / 100 : 0),
    [total, depositAmount, isDepositMode],
  )

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
        business_id: businessId,
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
  }, [selected, startDate, endDate, businessId])

  // Start Stripe checkout for a booking. payFullChoice ignores the deposit and
  // charges the full amount. Redirects the customer to Stripe on success.
  async function startCheckout(id: string, payFullChoice: boolean): Promise<boolean> {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: id, pay_full: payFullChoice }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || 'Could not start payment')
    if (!data.url) throw new Error('No checkout URL returned')
    if (window.top !== window.self) window.open(data.url, '_blank')
    else window.location.href = data.url
    return true
  }

  // When the business requires payment, we must have Stripe to enforce it.
  const enforcePayment = paymentRequired && stripeEnabled

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    if (!startDate || !endDate || endDate < startDate) {
      setError('Please pick a valid start and end date.')
      return
    }
    if (termsEnabled && !termsAccepted) {
      setError('Please accept the terms and conditions to continue.')
      return
    }
    for (const q of questions) {
      if (!q.required) continue
      const a = answers[q.id]
      if (q.type === 'checkbox' ? a !== 'yes' : !(a && a.trim())) {
        setError(
          q.type === 'checkbox'
            ? 'Please tick: ' + q.label
            : 'Please answer: ' + q.label,
        )
        return
      }
    }
    setSubmitting(true)
    setError(null)
    const customFields: Record<string, string> = {}
    for (const q of questions) {
      const a = answers[q.id]
      if (q.type === 'checkbox') {
        if (a === 'yes') customFields[q.label] = 'Yes'
      } else if (a && a.trim()) {
        customFields[q.label] = a.trim()
      }
    }
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          product_id: selected.id,
          start_date: startDate,
          end_date: endDate,
          terms_accepted: termsAccepted,
          custom_fields: customFields,
          ...form,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Booking failed')
      const newId = data.booking?.id
      if (newId) setBookingId(newId)

      // Payment-required mode: send the customer straight to Stripe. No unpaid
      // "request" state is presented. If checkout fails to start, fall back to
      // the done screen so they can retry or use manual payment.
      if (enforcePayment && newId) {
        try {
          await startCheckout(newId, payFull)
          return
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Could not start payment')
        }
      }
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
                    if (!bookingId) return
                    setLoadingPayment(true)
                    setPaymentError(null)
                    try {
                      await startCheckout(bookingId, payFull)
                    } catch (err: unknown) {
                      setPaymentError(
                        err instanceof Error ? err.message : 'Could not start payment',
                      )
                    } finally {
                      setLoadingPayment(false)
                    }
                  }}
                  disabled={loadingPayment}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
                >
                  {loadingPayment
                    ? 'Loading...'
                    : isDepositMode
                      ? `Pay €${depositAmount.toFixed(2)} deposit`
                      : 'Pay with card'}
                </button>
                {paymentError && (
                  <p className="mt-2 text-center text-xs text-rose-600">{paymentError}</p>
                )}
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
            {selected && (
              <div className="rounded-2xl border-2 border-brand-500 bg-white p-4 shadow-md shadow-brand-500/10">
                <div className="flex items-start gap-3">
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-ink-100 sm:h-24 sm:w-24">
                    {selected.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={selected.image_url}
                        alt={selected.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-ink-300">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M21 8 12 3 3 8v8l9 5 9-5V8z" />
                          <path d="m3 8 9 5 9-5M12 13v8" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                      <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      You selected this
                    </div>
                    <div className="mt-1 truncate text-base font-semibold text-ink-900">{selected.name}</div>
                    {selected.price_on_request ? (
                      <div className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-amber-700">
                        Call for price
                      </div>
                    ) : (
                      <div className="mt-1 inline-flex items-baseline gap-1 text-sm font-semibold text-brand-700">
                        €{selected.price_per_day}
                        <span className="text-[11px] font-normal text-brand-500">/day</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPickerOpen((o) => !o)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs font-semibold text-ink-700 transition hover:bg-ink-50"
                >
                  {pickerOpen ? (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                      Hide other items
                    </>
                  ) : (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                      Browse other castles
                    </>
                  )}
                </button>
              </div>
            )}

            {(!selected || pickerOpen) && (
              <h2 className="text-sm font-semibold text-ink-800">
                {selected ? 'Browse all items' : 'Pick an item'}
              </h2>
            )}
            {(!selected || pickerOpen) && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {products.map((p) => {
                const active = selected?.id === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelected(p)
                      setPickerOpen(false)
                    }}
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
                      {p.price_on_request ? (
                        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-sm font-semibold text-amber-700">
                          Call for price
                        </div>
                      ) : (
                        <div className="mt-2 inline-flex items-baseline gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-sm font-semibold text-brand-700">
                          €{p.price_per_day}
                          <span className="text-[11px] font-normal text-brand-500">/day</span>
                        </div>
                      )}
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
            )}

            {selected && selected.price_on_request && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-ink-900">Get a quote</h3>
                <p className="mt-1.5 text-sm text-ink-700">
                  This item is priced on request. Contact {businessName} for a quote and to check availability.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {businessPhone && (
                    <a
                      href={`tel:${businessPhone.replace(/\s+/g, '')}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-700"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Call {businessPhone}
                    </a>
                  )}
                  {businessEmail && (
                    <a
                      href={`mailto:${businessEmail}?subject=${encodeURIComponent('Quote request: ' + selected.name)}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-ink-300 bg-white px-4 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-ink-50"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="22,6 12,13 2,6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Email a quote
                    </a>
                  )}
                </div>
                {!businessPhone && !businessEmail && (
                  <p className="mt-3 text-xs text-ink-500">
                    Contact details for {businessName} aren&apos;t set up yet.
                  </p>
                )}
              </div>
            )}

            {selected && !selected.price_on_request && (
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
                      onChange={(e) => {
                        const v = e.target.value
                        setStartDate(v)
                        // Keep end_date >= start_date automatically
                        if (endDate && v && endDate < v) setEndDate(v)
                      }}
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
                    <div className="space-y-2">
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
                      {isDepositMode && (
                        <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-xs text-ink-700">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-semibold text-ink-900">Pay today (deposit):</span>
                            <span className="text-base font-bold text-brand-700">€{depositAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2 text-ink-600">
                            <span>Balance to settle directly with {businessName}:</span>
                            <span className="font-semibold">€{balanceAmount.toFixed(2)}</span>
                          </div>
                          <div className="mt-2 text-[11px] text-ink-500 leading-relaxed">
                            Pay the {depositPctClamped}% deposit online now to confirm your booking. The remaining €{balanceAmount.toFixed(2)} is payable directly to {businessName} (cash, transfer, or however you arrange together).
                          </div>
                        </div>
                      )}
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
              {isDepositMode && enforcePayment ? (
                <div className="mt-3 pt-3 border-t border-ink-100">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                    Choose how to pay
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPayFull(false)}
                      className={`rounded-xl border p-3 text-left transition ${!payFull ? 'border-brand-500 bg-brand-50' : 'border-ink-200 hover:border-ink-300'}`}
                    >
                      <div className="text-xs font-semibold text-ink-900">Pay {depositPctClamped}% deposit</div>
                      <div className="text-base font-bold text-brand-700">€{depositAmount.toFixed(2)}</div>
                      <div className="text-[10px] text-ink-500">€{balanceAmount.toFixed(2)} due on the day</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayFull(true)}
                      className={`rounded-xl border p-3 text-left transition ${payFull ? 'border-brand-500 bg-brand-50' : 'border-ink-200 hover:border-ink-300'}`}
                    >
                      <div className="text-xs font-semibold text-ink-900">Pay in full</div>
                      <div className="text-base font-bold text-brand-700">€{total.toFixed(2)}</div>
                      <div className="text-[10px] text-ink-500">Nothing left to pay</div>
                    </button>
                  </div>
                </div>
              ) : isDepositMode ? (
                <div className="mt-3 pt-3 border-t border-ink-100 text-xs text-ink-700">
                  <div className="flex items-center justify-between gap-2">
                    <span>Pay now ({depositPctClamped}% deposit)</span>
                    <span className="font-semibold text-ink-900">€{depositAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-ink-500">
                    <span>Balance owed to {businessName}</span>
                    <span>€{balanceAmount.toFixed(2)}</span>
                  </div>
                </div>
              ) : null}
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

            {questions.length > 0 && (
              <div className="space-y-3 rounded-2xl border border-ink-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-ink-800">A few more details</h3>
                {questions.map((q) =>
                  q.type === 'checkbox' ? (
                    <label key={q.id} className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={answers[q.id] === 'yes'}
                        onChange={(e) =>
                          setAnswers((a) => ({ ...a, [q.id]: e.target.checked ? 'yes' : '' }))
                        }
                        className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-ink-300 text-brand-600"
                      />
                      <span className="text-xs leading-relaxed text-ink-700">
                        {q.label}
                        {q.required && <span className="text-rose-500"> *</span>}
                      </span>
                    </label>
                  ) : (
                    <label key={q.id} className="block">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                        {q.label}
                        {q.required && <span className="text-rose-500"> *</span>}
                      </span>
                      <input
                        type="text"
                        value={answers[q.id] || ''}
                        onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                        className="mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      />
                    </label>
                  ),
                )}
              </div>
            )}

            {termsEnabled && (
              <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-sm">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-ink-300 text-brand-600 focus:ring-brand-500/30"
                  />
                  <span className="text-xs leading-relaxed text-ink-700">
                    I agree to the{' '}
                    {termsUrl ? (
                      <a
                        href={termsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-brand-700 underline hover:text-brand-800"
                      >
                        terms and conditions
                      </a>
                    ) : termsText ? (
                      <button
                        type="button"
                        onClick={() => setShowTerms((s) => !s)}
                        className="font-semibold text-brand-700 underline hover:text-brand-800"
                      >
                        terms and conditions
                      </button>
                    ) : (
                      <span className="font-semibold text-ink-900">terms and conditions</span>
                    )}
                    , including the booking, delivery and cancellation policy.
                  </span>
                </label>
                {termsText && showTerms && (
                  <div className="mt-3 max-h-48 overflow-auto whitespace-pre-line rounded-xl border border-ink-100 bg-ink-50/60 p-3 text-[11px] leading-relaxed text-ink-600">
                    {termsText}
                  </div>
                )}
              </div>
            )}

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
                disabled={submitting || (termsEnabled && !termsAccepted)}
                className="flex-[2] rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:bg-ink-200 disabled:text-ink-400"
              >
                {submitting
                  ? 'Sending...'
                  : enforcePayment
                    ? payFull
                      ? `Pay €${total.toFixed(2)} now`
                      : isDepositMode
                        ? `Pay €${depositAmount.toFixed(2)} deposit`
                        : `Pay €${total.toFixed(2)} now`
                    : 'Request booking'}
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
