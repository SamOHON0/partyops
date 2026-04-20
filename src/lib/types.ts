export interface Business {
  id: string
  name: string
  email: string
  phone?: string | null
  address?: string | null
  payment_instructions?: string | null
  payment_link?: string | null
  stripe_account_id?: string | null
  plan?: 'starter' | 'pro' | 'scale' | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  business_id: string
  name: string
  description?: string | null
  price_per_day: number
  image_url?: string | null
  quantity_available: number
  delivery_fee: number
  setup_time_buffer: number
  created_at: string
  updated_at: string
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded'

export interface Booking {
  id: string
  business_id: string
  product_id: string
  customer_name: string
  email: string
  phone: string
  address: string
  start_date: string
  end_date: string
  status: BookingStatus
  payment_status?: PaymentStatus | null
  stripe_session_id?: string | null
  total_price: number
  created_at: string
  updated_at: string
}

export interface BookingWithProduct extends Booking {
  product: Product
}

export interface AvailabilityCheck {
  product_id: string
  start_date: string
  end_date: string
  available_quantity: number
  is_available: boolean
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

export interface InvoiceLineItem {
  description: string
  quantity: number
  unit_price: number
}

export interface Invoice {
  id: string
  business_id: string
  booking_id?: string | null
  customer_name: string
  customer_email: string | null
  customer_address: string | null
  invoice_number: string
  issue_date: string
  due_date: string
  status: InvoiceStatus
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  notes: string | null
  line_items: InvoiceLineItem[]
  created_at: string
  updated_at: string
}

export interface CustomerSummary {
  email: string
  name: string
  phone: string | null
  bookings_count: number
  lifetime_value: number
  last_booking_date: string
  first_booking_date: string
  statuses: Record<BookingStatus, number>
}
