'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { PlusIcon, TrashIcon } from '@/components/ui/Icon'
import { fmtCurrencyFull } from '@/lib/format'
import type { InvoiceLineItem } from '@/lib/types'

type Prefill = {
  customer_name?: string
  customer_email?: string
  customer_address?: string
  booking_id?: string
  line_items?: InvoiceLineItem[]
}

export function InvoiceForm({
  action,
  defaultInvoiceNumber,
  prefill = {},
}: {
  action: (formData: FormData) => void | Promise<void>
  defaultInvoiceNumber: string
  prefill?: Prefill
}) {
  const today = new Date().toISOString().slice(0, 10)
  const plus14 = new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10)

  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(
    prefill.line_items && prefill.line_items.length
      ? prefill.line_items
      : [{ description: '', quantity: 1, unit_price: 0 }],
  )
  const [taxRate, setTaxRate] = useState<number>(0)

  const { subtotal, tax, total } = useMemo(() => {
    const subtotal = lineItems.reduce(
      (s, it) => s + Number(it.quantity || 0) * Number(it.unit_price || 0),
      0,
    )
    const tax = Math.round(subtotal * (taxRate / 100) * 100) / 100
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax,
      total: Math.round((subtotal + tax) * 100) / 100,
    }
  }, [lineItems, taxRate])

  function addLine() {
    setLineItems((prev) => [...prev, { description: '', quantity: 1, unit_price: 0 }])
  }

  function removeLine(i: number) {
    setLineItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)))
  }

  function updateLine(i: number, patch: Partial<InvoiceLineItem>) {
    setLineItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  }

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      {/* Main column */}
      <div className="space-y-6">
        {/* Header */}
        <div className="po-card p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Invoice number" htmlFor="invoice_number">
              <input
                id="invoice_number"
                name="invoice_number"
                defaultValue={defaultInvoiceNumber}
                required
                className="po-input font-mono"
              />
            </Field>
            <Field label="Status" htmlFor="status">
              <select id="status" name="status" defaultValue="draft" className="po-input">
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
              </select>
            </Field>
            <Field label="Issue date" htmlFor="issue_date">
              <input
                type="date"
                id="issue_date"
                name="issue_date"
                defaultValue={today}
                required
                className="po-input"
              />
            </Field>
            <Field label="Due date" htmlFor="due_date">
              <input
                type="date"
                id="due_date"
                name="due_date"
                defaultValue={plus14}
                required
                className="po-input"
              />
            </Field>
          </div>
        </div>

        {/* Customer */}
        <div className="po-card p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">
            Bill to
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Customer name" htmlFor="customer_name">
              <input
                id="customer_name"
                name="customer_name"
                defaultValue={prefill.customer_name || ''}
                required
                placeholder="Jane Doe"
                className="po-input"
              />
            </Field>
            <Field label="Email" htmlFor="customer_email">
              <input
                type="email"
                id="customer_email"
                name="customer_email"
                defaultValue={prefill.customer_email || ''}
                placeholder="jane@example.com"
                className="po-input"
              />
            </Field>
            <Field label="Address" htmlFor="customer_address" full>
              <textarea
                id="customer_address"
                name="customer_address"
                defaultValue={prefill.customer_address || ''}
                placeholder="123 Main St, Dublin"
                rows={2}
                className="po-input"
              />
            </Field>
          </div>
          {prefill.booking_id && (
            <input type="hidden" name="booking_id" value={prefill.booking_id} />
          )}
        </div>

        {/* Line items */}
        <div className="po-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
              Line items
            </h3>
            <button
              type="button"
              onClick={addLine}
              className="po-btn po-btn-ghost text-xs"
            >
              <PlusIcon size={14} />
              Add line
            </button>
          </div>

          <div className="space-y-2">
            <div className="hidden grid-cols-[1fr_80px_100px_100px_32px] gap-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-ink-400 sm:grid">
              <div>Description</div>
              <div className="text-right">Qty</div>
              <div className="text-right">Unit price</div>
              <div className="text-right">Amount</div>
              <div />
            </div>
            {lineItems.map((line, i) => {
              const amount = Number(line.quantity || 0) * Number(line.unit_price || 0)
              return (
                <div
                  key={i}
                  className="grid grid-cols-1 gap-2 rounded-lg border border-ink-100 p-2 sm:grid-cols-[1fr_80px_100px_100px_32px] sm:border-0 sm:p-0"
                >
                  <input
                    name="li_description"
                    value={line.description}
                    onChange={(e) => updateLine(i, { description: e.target.value })}
                    placeholder="Service or item"
                    className="po-input"
                  />
                  <input
                    name="li_quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.quantity}
                    onChange={(e) =>
                      updateLine(i, { quantity: Number(e.target.value) })
                    }
                    className="po-input text-right"
                  />
                  <input
                    name="li_unit_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unit_price}
                    onChange={(e) =>
                      updateLine(i, { unit_price: Number(e.target.value) })
                    }
                    className="po-input text-right"
                  />
                  <div className="flex items-center justify-end px-2 text-sm font-medium text-ink-900">
                    {fmtCurrencyFull(amount)}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    disabled={lineItems.length <= 1}
                    className="flex items-center justify-center rounded-md p-1.5 text-ink-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-400"
                    aria-label="Remove line"
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Notes */}
        <div className="po-card p-5">
          <Field label="Notes (visible on invoice)" htmlFor="notes">
            <textarea
              id="notes"
              name="notes"
              placeholder="Payment terms, bank details, thank you message..."
              rows={3}
              className="po-input"
            />
          </Field>
        </div>
      </div>

      {/* Sidebar: totals */}
      <aside>
        <div className="po-card sticky top-4 p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">
            Summary
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-ink-600">Subtotal</dt>
              <dd className="font-medium text-ink-900">{fmtCurrencyFull(subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink-600">Tax (%)</dt>
              <dd>
                <input
                  name="tax_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="po-input w-20 text-right text-sm"
                />
              </dd>
            </div>
            <div className="flex items-center justify-between text-ink-600">
              <dt>Tax amount</dt>
              <dd>{fmtCurrencyFull(tax)}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-ink-100 pt-3 text-base font-semibold text-ink-900">
              <dt>Total</dt>
              <dd>{fmtCurrencyFull(total)}</dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-col gap-2">
            <button type="submit" className="po-btn po-btn-primary w-full">
              Save invoice
            </button>
            <Link href="/admin/invoices" className="po-btn po-btn-ghost w-full">
              Cancel
            </Link>
          </div>
        </div>
      </aside>
    </form>
  )
}

function Field({
  label,
  htmlFor,
  children,
  full,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
  full?: boolean
}) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-ink-700">
        {label}
      </label>
      {children}
    </div>
  )
}
