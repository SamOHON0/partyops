import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerComponentClient } from '@/lib/supabase'
import { getNextInvoiceNumber } from '@/lib/api/invoices'
import { PageHeader } from '@/components/ui/PageHeader'
import { ArrowRightIcon } from '@/components/ui/Icon'
import { InvoiceForm } from '@/components/admin/InvoiceForm'
import { daysBetween } from '@/lib/format'
import type { InvoiceLineItem } from '@/lib/types'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{
  booking?: string
  email?: string
  name?: string
  error?: string
}>

async function createInvoice(formData: FormData) {
  'use server'
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const invoice_number = (formData.get('invoice_number') as string) || ''
  const customer_name = (formData.get('customer_name') as string) || ''
  const customer_email = (formData.get('customer_email') as string) || null
  const customer_address = (formData.get('customer_address') as string) || null
  const issue_date = (formData.get('issue_date') as string) || new Date().toISOString().slice(0, 10)
  const due_date = (formData.get('due_date') as string) || issue_date
  const status = (formData.get('status') as string) || 'draft'
  const booking_id = (formData.get('booking_id') as string) || null
  const notes = (formData.get('notes') as string) || null
  const tax_rate = Number(formData.get('tax_rate') || 0)

  // Parse line items
  const descriptions = formData.getAll('li_description')
  const quantities = formData.getAll('li_quantity')
  const unit_prices = formData.getAll('li_unit_price')

  const line_items: InvoiceLineItem[] = []
  for (let i = 0; i < descriptions.length; i++) {
    const description = String(descriptions[i] || '').trim()
    const quantity = Number(quantities[i] || 0)
    const unit_price = Number(unit_prices[i] || 0)
    if (!description && quantity === 0 && unit_price === 0) continue
    line_items.push({ description, quantity, unit_price })
  }

  const subtotal = line_items.reduce((s, it) => s + it.quantity * it.unit_price, 0)
  const tax_amount = Math.round(subtotal * (tax_rate / 100) * 100) / 100
  const total = Math.round((subtotal + tax_amount) * 100) / 100

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      business_id: user.id,
      booking_id,
      invoice_number,
      customer_name,
      customer_email,
      customer_address,
      issue_date,
      due_date,
      status,
      line_items,
      subtotal: Math.round(subtotal * 100) / 100,
      tax_rate,
      tax_amount,
      total,
      notes,
    })
    .select('id')
    .single()

  if (error) {
    redirect(`/admin/invoices/new?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/admin/invoices')
  redirect(`/admin/invoices/${data!.id}`)
}

export default async function NewInvoicePage({
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

  const invoiceNumber = await getNextInvoiceNumber(user.id)

  // Prefill from booking if provided
  let prefill: {
    customer_name?: string
    customer_email?: string
    customer_address?: string
    booking_id?: string
    line_items?: InvoiceLineItem[]
  } = {}

  if (params.booking) {
    const { data: booking } = await supabase
      .from('bookings')
      .select('*, product:products(*)')
      .eq('id', params.booking)
      .eq('business_id', user.id)
      .maybeSingle()

    if (booking) {
      const days = daysBetween(booking.start_date, booking.end_date)
      const lineItems: InvoiceLineItem[] = [
        {
          description: `${booking.product?.name || 'Rental'} (${booking.start_date} to ${booking.end_date})`,
          quantity: days,
          unit_price: Number(booking.product?.price_per_day || 0),
        },
      ]
      if (booking.product?.delivery_fee && Number(booking.product.delivery_fee) > 0) {
        lineItems.push({
          description: 'Delivery & setup',
          quantity: 1,
          unit_price: Number(booking.product.delivery_fee),
        })
      }
      prefill = {
        customer_name: booking.customer_name,
        customer_email: booking.email,
        customer_address: booking.address,
        booking_id: booking.id,
        line_items: lineItems,
      }
    }
  } else if (params.email || params.name) {
    prefill = {
      customer_email: params.email,
      customer_name: params.name,
    }
  }

  return (
    <>
      <div className="mb-2">
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

      <PageHeader title="New invoice" description="Build a clean invoice in under a minute." />

      {params.error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {params.error}
        </div>
      )}

      <InvoiceForm
        action={createInvoice}
        defaultInvoiceNumber={invoiceNumber}
        prefill={prefill}
      />
    </>
  )
}
