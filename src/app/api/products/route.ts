import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { corsPreflight, withCors } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return corsPreflight(request)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('business_id')
    if (!businessId) return withCors({ error: 'business_id is required' }, 400, request)

    // Validate UUID format
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRe.test(businessId)) {
      return withCors({ error: 'Invalid business ID' }, 400, request)
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('products')
      .select('id, business_id, name, description, price_per_day, image_url, quantity_available, delivery_fee')
      .eq('business_id', businessId)
      .order('name')

    if (error) throw error
    return withCors(data ?? [], 200, request)
  } catch (error) {
    console.error('API /products error:', error)
    return withCors({ error: 'Internal server error' }, 500, request)
  }
}
