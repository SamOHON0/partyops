'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClientComponentClient } from '@/lib/supabase-client'
import { LogoWordmark } from '@/components/ui/Logo'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-5 flex justify-center">
            <LogoWordmark />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Reset your password</h1>
          <p className="mt-1 text-sm text-ink-500">
            We will email you a link to set a new password.
          </p>
        </div>

        {sent ? (
          <div className="po-card p-6 text-center text-sm text-ink-700">
            Check your email for a reset link. If it does not arrive in a few minutes, check spam.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="po-card space-y-4 p-6">
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

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="po-btn po-btn-primary w-full">
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-ink-500">
          <Link href="/admin/login" className="font-medium text-brand-700 hover:text-brand-800">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
