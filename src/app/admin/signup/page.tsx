'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogoMark, LogoWordmark } from '@/components/ui/Logo'

export default function AdminSignup() {
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setInfo('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { business_name: businessName } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.session) {
      router.push('/admin')
    } else {
      setInfo('Check your email to confirm your account, then sign in.')
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 inline-flex items-center gap-2">
            <LogoMark size={28} />
            <LogoWordmark />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Start taking bookings in minutes. No card required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="po-card space-y-4 p-6">
          <div>
            <label htmlFor="business" className="mb-1.5 block text-xs font-medium text-ink-700">
              Business name
            </label>
            <input
              id="business"
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Sam's Castles"
              className="po-input"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-ink-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourbusiness.ie"
              className="po-input"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-ink-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="po-input"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}
          {info && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {info}
            </div>
          )}

          <button type="submit" disabled={loading} className="po-btn po-btn-primary w-full">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-500">
          Already have one?{' '}
          <Link href="/admin/login" className="font-medium text-brand-700 hover:text-brand-800">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
