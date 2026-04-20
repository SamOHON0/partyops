import { createServerComponentClient } from '@/lib/supabase'
import { Booking, BookingWithProduct } from '@/lib/types'

export async function getBookings(businessId: string): Promise<BookingWithProduct[]> {
  const supabase = await createServerComponentClient()

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      product:products(*)
    `)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as BookingWithProduct[]) || []
}

export async function getBooking(id: string): Promise<BookingWithProduct | null> {
  const supabase = await createServerComponentClient()

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      product:products(*)
    `)
    .eq('id', id)
    .single()

  if (error) return null
  return data as BookingWithProduct
}

export async function updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
  const supabase = await createServerComponentClient()

  const { data, error } = await supabase
    .from('bookings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteBooking(id: string): Promise<void> {
  const supabase = await createServerComponentClient()

  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id)

  if (error) throw error
}
