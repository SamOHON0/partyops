import { createServerComponentClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createServerComponentClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/admin/login', request.url), { status: 303 })
}
