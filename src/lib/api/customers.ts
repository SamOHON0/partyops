import type {
  BookingStatus,
  BookingWithProduct,
  CustomerSummary,
} from '@/lib/types'
import { getBookings } from '@/lib/api/bookings'

export type CustomerRecord = CustomerSummary & {
  address: string | null
  bookings: BookingWithProduct[]
  /** Stable URL-safe identifier (email-based when possible, else name+phone). */
  key: string
}

/**
 * Derive a customer list from bookings, aggregated by email (with a fallback
 * synthetic key for email-less bookings).
 */
export async function getCustomers(businessId: string): Promise<CustomerRecord[]> {
  const bookings = await getBookings(businessId)
  return aggregateCustomers(bookings)
}

export async function getCustomerByKey(
  businessId: string,
  key: string,
): Promise<CustomerRecord | null> {
  const customers = await getCustomers(businessId)
  return customers.find((c) => c.key === key) || null
}

/** Build a URL-safe customer key. Prefers email; falls back to name|phone. */
export function customerKey(email: string | null, name?: string, phone?: string | null): string {
  if (email && email.trim()) {
    return encodeURIComponent(email.trim().toLowerCase())
  }
  const fallback = `${(name || '').trim()}|${(phone || '').trim()}`.toLowerCase()
  return encodeURIComponent(`anon:${fallback}`)
}

function aggregateCustomers(bookings: BookingWithProduct[]): CustomerRecord[] {
  const map = new Map<string, CustomerRecord>()

  for (const b of bookings) {
    const hasEmail = !!(b.email && b.email.trim())
    const key = customerKey(b.email, b.customer_name, b.phone)
    if (!key) continue

    const existing = map.get(key)
    const price = Number(b.total_price || 0)
    const status = b.status as BookingStatus

    if (existing) {
      existing.bookings.push(b)
      existing.bookings_count += 1
      existing.lifetime_value += price
      existing.statuses[status] = (existing.statuses[status] || 0) + 1
      if (b.start_date > existing.last_booking_date) existing.last_booking_date = b.start_date
      if (b.start_date < existing.first_booking_date) existing.first_booking_date = b.start_date
      if (!existing.phone && b.phone && b.phone !== '-') existing.phone = b.phone
      if (!existing.address && b.address && b.address !== '-') existing.address = b.address
    } else {
      const statuses: Record<BookingStatus, number> = {
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
      }
      statuses[status] = 1
      map.set(key, {
        key,
        email: hasEmail ? b.email! : '',
        name: b.customer_name,
        phone: b.phone && b.phone !== '-' ? b.phone : null,
        address: b.address && b.address !== '-' ? b.address : null,
        bookings_count: 1,
        lifetime_value: price,
        last_booking_date: b.start_date,
        first_booking_date: b.start_date,
        statuses,
        bookings: [b],
      })
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    b.last_booking_date.localeCompare(a.last_booking_date),
  )
}
