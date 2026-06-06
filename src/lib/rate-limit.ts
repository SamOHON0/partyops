import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

/**
 * Best-effort client IP for rate limiting. On Vercel the real client address is
 * the first entry of x-forwarded-for; we fall back to x-real-ip and finally a
 * constant so a missing header buckets everyone together rather than throwing.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

/**
 * Returns true if the request is allowed, false if the caller has exceeded
 * `limit` within `windowSeconds`. Backed by the check_rate_limit Postgres
 * function (migration 012) via the service-role client.
 *
 * Fails OPEN: if the limiter itself errors we allow the request, so a database
 * hiccup can never take down booking creation. The trade-off is that an outage
 * temporarily removes the limit, which is acceptable for this use case.
 */
export async function checkRateLimit(
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_bucket: bucket,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    })
    if (error) {
      console.error('checkRateLimit RPC error, allowing request:', error)
      return true
    }
    return data === true
  } catch (err) {
    console.error('checkRateLimit failed, allowing request:', err)
    return true
  }
}
