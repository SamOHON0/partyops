import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { corsPreflight, withCors } from '@/lib/cors'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

// Public, unauthenticated write endpoint - keep a per-IP cap so a script can't
// flood pending bookings (which also exhaust availability). Tuned to comfortably
// allow a real customer booking a few items in one sitting.
const BOOKING_LIMIT = 6
const BOOKING_WINDOW_SECONDS = 600

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request)
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const allowed = await checkRateLimit(`bookings:${ip}`, BOOKING_LIMIT, BOOKING_WINDOW_SECONDS)
    if (!allowed) {
      return withCors(
        { error: 'Too many booking attempts. Please try again in a few minutes.' },
        { status: 429, headers: { 'Retry-After': String(BOOKING_WINDOW_SECONDS) } },
        request,
      )
    }

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
    if (body.end_date < body.start_date) {
      return withCors({ error: 'End date must be on or after start date' }, 400, request)
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

    // Terms & conditions are only enforced if this business has them enabled.
    const { data: bizTerms } = await supabase
      .from('businesses')
      .select('terms_enabled, plan')
      .eq('id', body.business_id)
      .maybeSingle()
    const termsRequired = bizTerms?.terms_enabled === true
    if (termsRequired && body.terms_accepted !== true) {
      return withCors({ error: 'You must accept the terms and conditions to book.' }, 400, request)
    }

    // Plan limit: Starter (free) is capped at 10 bookings per calendar month.
    const plan = bizTerms?.plan ?? 'starter'
    if (plan === 'starter') {
      const monthStart = new Date()
      monthStart.setUTCDate(1)
      monthStart.setUTCHours(0, 0, 0, 0)
      const { count } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', body.business_id)
        .neq('status', 'cancelled')
        .gte('created_at', monthStart.toISOString())
      if ((count ?? 0) >= 10) {
        return withCors(
          { error: 'Online booking is temporarily unavailable. Please contact the business to book.' },
          403,
          request,
        )
      }
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

    // Record terms acceptance and any custom question answers on the new booking.
    if (data?.id) {
      const postUpdate: Record<string, unknown> = {}
      if (body.terms_accepted === true) {
        postUpdate.terms_accepted = true
        postUpdate.terms_accepted_at = new Date().toISOString()
      }
      if (
        body.custom_fields &&
        typeof body.custom_fields === 'object' &&
        !Array.isArray(body.custom_fields)
      ) {
        // Cap size and coerce to strings - this is a public endpoint, so don't
        // let a script stuff megabytes of arbitrary JSON into the row.
        const entries = Object.entries(body.custom_fields).slice(0, 30)
        const sanitized: Record<string, string> = {}
        for (const [k, v] of entries) {
          sanitized[String(k).slice(0, 200)] = String(v).slice(0, 1000)
        }
        postUpdate.custom_fields = sanitized
      }
      if (Object.keys(postUpdate).length > 0) {
        await supabase.from('bookings').update(postUpdate).eq('id', data.id)
      }
    }

    return withCors({ booking: data }, 201, request)
  } catch (error) {
    console.error('API /bookings error:', error)
    return withCors({ error: 'Internal server error' }, 500, request)
  }
}
