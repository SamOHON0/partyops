'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@/lib/supabase-client'
import { LogoWordmark } from '@/components/ui/Logo'

export default function ResetPassword() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  // The recovery email lands here. Exchange the code (PKCE) for a session, or
  // pick up the session Supabase set from the link, so we can update the password.
  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        if (code) {
          await supabase.auth.exchangeCodeForSession(code)
        }
        const { data } = await supabase.auth.getSession()
        if (!cancelled) {
          setReady(!!data.session)
          setChecking(false)
        }
      } catch {
        if (!cancelled) setChecking(false)
      }
    }
    init()
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true)
    })
    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setDone(true)
    setTimeout(() => {
      router.push('/admin')
      router.refresh()
    }, 1500)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-5 flex justify-center">
            <LogoWordmark />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Set a new password</h1>
        </div>

        {done ? (
          <div className="po-card p-6 text-center text-sm text-ink-700">
            Password updated. Taking you to your dashboard...
          </div>
        ) : checking ? (
          <div className="po-card p-6 text-center text-sm text-ink-500">Checking your link...</div>
        ) : !ready ? (
          <div className="po-card p-6 text-center text-sm text-ink-700">
            This reset link is invalid or has expired.{' '}
            <Link href="/admin/forgot-password" className="font-medium text-brand-700 hover:text-brand-800">
              Request a new one
            </Link>
            .
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="po-card space-y-4 p-6">
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-ink-700">
                New password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="po-input"
              />
            </div>
            <div>
              <label htmlFor="confirm" className="mb-1.5 block text-xs font-medium text-ink-700">
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="po-input"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="po-btn po-btn-primary w-full">
              {loading ? 'Saving...' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
