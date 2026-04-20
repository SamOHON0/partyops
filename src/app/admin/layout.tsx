import type { ReactNode } from 'react'
import { createServerComponentClient } from '@/lib/supabase'
import { Sidebar } from '@/components/admin/Sidebar'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Unauthenticated: render bare (login/signup style themselves)
  if (!user) return <>{children}</>

  const { data: business } = await supabase
    .from('businesses')
    .select('name')
    .eq('id', user.id)
    .maybeSingle()

  const businessName: string = business?.name || 'Your business'
  const initials =
    businessName
      .split(/\s+/)
      .map((w: string) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'PO'

  return (
    <div className="min-h-screen bg-ink-50/50">
      <Sidebar businessName={businessName} initials={initials} userEmail={user.email || ''} />
      <main className="lg:pl-60">
        <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-20 sm:px-6 lg:px-8 lg:pt-10">
          {children}
        </div>
      </main>
    </div>
  )
}
