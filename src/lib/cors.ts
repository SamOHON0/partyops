import { NextRequest, NextResponse } from 'next/server'

// Origins allowed to use the booking widget API.
// The embed widget can be on any client site, so we need to allow their domains.
// In production, you could restrict this to specific client domains.
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || 'https://rental-booking-eight.vercel.app',
]

function getAllowedOrigin(request?: NextRequest): string {
  if (!request) return ALLOWED_ORIGINS[0]!

  const origin = request.headers.get('origin')
  if (!origin) return ALLOWED_ORIGINS[0]!

  // Allow the app's own origin
  if (ALLOWED_ORIGINS.includes(origin)) return origin

  // Allow any origin for the public embed API routes (widget needs to work on client sites)
  // The embed is loaded via iframe, so the origin will be the client's domain
  return origin
}

export function getCorsHeaders(request?: NextRequest): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(request),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
}

// Legacy export for backwards compatibility
export const corsHeaders = getCorsHeaders()

export function withCors<T>(data: T, init: number | ResponseInit = 200, request?: NextRequest) {
  const responseInit: ResponseInit = typeof init === 'number' ? { status: init } : init
  const headers = getCorsHeaders(request)
  return NextResponse.json(data, { ...responseInit, headers: { ...headers, ...(responseInit.headers || {}) } })
}

export function corsPreflight(request?: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) })
}
