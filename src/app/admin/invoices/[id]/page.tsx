import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerComponentClient } from '@/lib/supabase'
import { getInvoice, isOverdue } from '@/lib/api/invoices'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import {
  ArrowRightIcon,
  MailIcon,
  MapPinIcon,
  TrashIcon,
  InvoiceIcon,
} from '@/components/ui/Icon'
import { PrintButton } from '@/components/admin/PrintButton'
import { LogoMark } from '@/components/ui/Logo'
import { fmtCurrencyFull, fmtDateLong } from '@/lib/format'
import type { InvoiceLineItem } from '@/lib/types'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

async function updateStatus(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const status = formData.get('status') as string
  const allowed = ['draft', 'sent', 'paid', 'overdue']
  if (!allowed.includes(status)) return

  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('invoices')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('business_id', user.id)

  revalidatePath('/admin/invoices')
  revalidatePath(`/admin/invoices/${id}`)
}

async function removeInvoice(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('invoices').delete().eq('id', id).eq('business_id', user.id)
  revalidatePath('/admin/invoices')
  redirect('/admin/invoices')
}

export default async function InvoiceDetail({ params }: PageProps) {
  const { id } = await params
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const invoice = await getInvoice(id)
  if (!invoice || invoice.business_id !== user.id) notFound()

  const { data: business } = await supabase
    .from('businesses')
    .select('name, email, phone, address')
    .eq('id', user.id)
    .maybeSingle()

  const lineItems: InvoiceLineItem[] = Array.isArray(invoice.line_items)
    ? invoice.line_items
    : []

  const displayStatus = invoice.status === 'sent' && isOverdue(invoice) ? 'overdue' : invoice.status

  return (
    <>
      <div className="mb-2 flex items-center justify-between print:hidden">
        <Link
          href="/admin/invoices"
          className="inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-900"
        >
          <span className="rotate-180">
            <ArrowRightIcon size={12} />
          </span>
          All invoices
        </Link>
      </div>

      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-2xl font-semibold tracking-tight text-ink-900">
              {invoice.invoice_number}
            </h1>
            <StatusBadge status={displayStatus} />
          </div>
          <p className="mt-1 text-sm text-ink-500">
            {invoice.customer_name} · {fmtCurrencyFull(Number(invoice.total || 0))}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {invoice.status !== 'paid' && (
            <form action={updateStatus}>
              <input type="hidden" name="id" value={invoice.id} />
              <input type="hidden" name="status" value="paid" />
              <button type="submit" className="po-btn po-btn-primary">
                Mark as paid
              </button>
            </form>
          )}
          {invoice.status === 'draft' && (
            <form action={updateStatus}>
              <input type="hidden" name="id" value={invoice.id} />
              <input type="hidden" name="status" value="sent" />
              <button type="submit" className="po-btn po-btn-secondary">
                Mark as sent
              </button>
            </form>
          )}
          <PrintButton />
        </div>
      </div>

      {/* Printable invoice sheet */}
      <div className="po-card mx-auto max-w-3xl p-10 print:border-0 print:shadow-none">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <LogoMark size={36} />
            <div>
              <div className="text-base font-semibold tracking-tight text-ink-900">
                {business?.name || 'Your business'}
              </div>
              {business?.email && (
                <div className="text-xs text-ink-500">{business.email}</div>
              )}
              {business?.phone && (
                <div className="text-xs text-ink-500">{business.phone}</div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
              Invoice
            </div>
            <div className="font-mono text-lg font-semibold text-ink-900">
              {invoice.invoice_number}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
              Bill to
            </div>
            <div className="mt-1 text-sm font-medium text-ink-900">
              {invoice.customer_name}
            </div>
            {invoice.customer_email && (
              <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-600">
                <MailIcon size={12} />
                {invoice.customer_email}
              </div>
            )}
            {invoice.customer_address && (
              <div className="mt-0.5 flex items-start gap-1 text-xs text-ink-600">
                <MapPinIcon size={12} />
                <span className="whitespace-pre-wrap">{invoice.customer_address}</span>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="mb-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                Issued
              </div>
              <div className="text-sm text-ink-900">{fmtDateLong(invoice.issue_date)}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                Due
              </div>
              <div className="text-sm text-ink-900">{fmtDateLong(invoice.due_date)}</div>
            </div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-lg border border-ink-100">
          <table className="w-full text-sm">
            <thead className="bg-ink-50/50 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-3 py-2 text-left">Description</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-right">Unit price</th>
                <th className="px-3 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {lineItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-xs text-ink-400">
                    No line items
                  </td>
                </tr>
              ) : (
                lineItems.map((it, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-ink-900">{it.description}</td>
                    <td className="px-3 py-2 text-right text-ink-700">{it.quantity}</td>
                    <td className="px-3 py-2 text-right text-ink-700">
                      {fmtCurrencyFull(Number(it.unit_price || 0))}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-ink-900">
                      {fmtCurrencyFull(
                        Number(it.quantity || 0) * Number(it.unit_price || 0),
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex justify-end">
          <dl className="w-full max-w-xs space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-ink-600">Subtotal</dt>
              <dd className="text-ink-900">{fmtCurrencyFull(Number(invoice.subtotal || 0))}</dd>
            </div>
            {Number(invoice.tax_rate || 0) > 0 && (
              <div className="flex items-center justify-between">
                <dt className="text-ink-600">Tax ({invoice.tax_rate}%)</dt>
                <dd className="text-ink-900">
                  {fmtCurrencyFull(Number(invoice.tax_amount || 0))}
                </dd>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-ink-200 pt-2 text-base font-semibold text-ink-900">
              <dt>Total</dt>
              <dd>{fmtCurrencyFull(Number(invoice.total || 0))}</dd>
            </div>
            {invoice.status === 'paid' && (
              <div className="flex justify-end pt-2">
                <Badge tone="success" dot>
                  Paid in full
                </Badge>
              </div>
            )}
          </dl>
        </div>

        {invoice.notes && (
          <div className="mt-8 border-t border-ink-100 pt-5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
              Notes
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-ink-700">{invoice.notes}</p>
          </div>
        )}

        {invoice.booking_id && (
          <div className="mt-6 flex justify-end print:hidden">
            <Link
              href={`/admin/bookings/${invoice.booking_id}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              <InvoiceIcon size={12} />
              Related booking
              <ArrowRightIcon size={12} />
            </Link>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="mx-auto mt-6 max-w-3xl print:hidden">
        <form action={removeInvoice}>
          <input type="hidden" name="id" value={invoice.id} />
          <button type="submit" className="po-btn po-btn-danger">
            <TrashIcon size={14} />
            Delete invoice
          </button>
        </form>
      </div>

    </>
  )
}
