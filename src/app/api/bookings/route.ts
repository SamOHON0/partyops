import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { corsPreflight, withCors } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const required = ['business_id', 'product_id', 'customer_name', 'email', 'phone', 'address', 'start_date', 'end_date']
    for (const field of required) {
      if (!body[field]) return withCors({ error: `${field} is required` }, 400, request)
    }

    // Validate string lengths to prevent abuse
    const maxLengths: Record<string, number> = { customer_name: 200, email: 254, phone: 30, address: 500 }
    for (const [field, max] of Object.entries(maxLengths)) {
      if (body[field] && String(body[field]).length > max) {
        return withCors({ error: `${field} is too long` }, 400, request)
      }
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return withCors({ error: 'Invalid email format' }, 400, request)
    }

    // Validate date format (YYYY-MM-DD)
    const dateRe = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRe.test(body.start_date) || !dateRe.test(body.end_date)) {
      return withCors({ error: 'Invalid date format. Use YYYY-MM-DD' }, 400, request)
    }

    // Validate UUID format for IDs
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRe.test(body.business_id) || !uuidRe.test(body.product_id)) {
      return withCors({ error: 'Invalid ID format' }, 400, request)
    }

    const supabase = createAdminClient()

    const { data: product, error: productErr } = await supabase
      .from('products')
      .select('id, price_on_request')
      .eq('id', body.product_id)
      .eq('business_id', body.business_id)
      .maybeSingle()
    if (productErr) throw productErr
    if (!product) return withCors({ error: 'product not found for business' }, 404, request)
    if (product.price_on_request) {
      return withCors(
        { error: 'This item requires a quote. Please contact the business directly.' },
        400,
        request,
      )
    }

    const { data, error } = await supabase.rpc('create_booking_atomic', {
      p_business_id: body.business_id,
      p_product_id: body.product_id,
      p_customer_name: body.customer_name,
      p_email: body.email,
      p_phone: body.phone,
      p_address: body.address,
      p_start_date: body.start_date,
      p_end_date: body.end_date,
    })

    if (error) {
      const message = error.message || 'booking failed'
      const status = /not available/i.test(message) ? 409 : 400
      return withCors({ error: message }, status, request)
    }

    return withCors({ booking: data }, 201, request)
  } catch (error) {
    console.error('API /bookings error:', error)
    return withCors({ error: 'Internal server error' }, 500, request)
  }
}
