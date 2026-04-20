import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { corsPreflight, withCors } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request)
}

export async function POST(request: NextRequest) {
  try {
    const { product_id, start_date, end_date } = await request.json()
    if (!product_id || !start_date || !end_date) {
      return withCors({ error: 'Missing required fields' }, 400, request)
    }

    // Validate date format
    const dateRe = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRe.test(start_date) || !dateRe.test(end_date)) {
      return withCors({ error: 'Invalid date format' }, 400, request)
    }

    // Validate UUID format
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRe.test(product_id)) {
      return withCors({ error: 'Invalid product ID' }, 400, request)
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase.rpc('get_available_quantity', {
      p_product_id: product_id,
      p_start_date: start_date,
      p_end_date: end_date,
    })
    if (error) throw error

    const remaining = Number(data ?? 0)
    return withCors({ available: remaining > 0, remaining }, 200, request)
  } catch (error) {
    console.error('API /availability error:', error)
    return withCors({ error: 'Internal server error' }, 500, request)
  }
}
