import { createServerComponentClient } from '@/lib/supabase'
import type { Invoice, InvoiceLineItem } from '@/lib/types'

export async function getInvoices(businessId: string): Promise<Invoice[]> {
  const supabase = await createServerComponentClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('business_id', businessId)
    .order('issue_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as Invoice[]) || []
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const supabase = await createServerComponentClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data as Invoice
}

export async function getNextInvoiceNumber(businessId: string): Promise<string> {
  const supabase = await createServerComponentClient()
  const { data, error } = await supabase.rpc('next_invoice_number', {
    p_business_id: businessId,
  })
  if (error || !data) return 'INV-0001'
  return data as string
}

export function computeTotals(
  lineItems: InvoiceLineItem[],
  taxRate = 0,
): { subtotal: number; tax: number; total: number } {
  const subtotal = lineItems.reduce(
    (s, it) => s + Number(it.quantity || 0) * Number(it.unit_price || 0),
    0,
  )
  const tax = Math.round(subtotal * (taxRate / 100) * 100) / 100
  const total = Math.round((subtotal + tax) * 100) / 100
  return { subtotal: Math.round(subtotal * 100) / 100, tax, total }
}

export function isOverdue(inv: Invoice): boolean {
  if (inv.status === 'paid') return false
  if (!inv.due_date) return false
  return new Date(inv.due_date) < new Date(new Date().toISOString().slice(0, 10))
}
