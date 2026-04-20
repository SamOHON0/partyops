'use client'

import { useState } from 'react'
import { ExternalLinkIcon } from '@/components/ui/Icon'

export default function StripeConnectButton({
  connected,
  accountId,
}: {
  connected: boolean
  accountId?: string | null
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConnect = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch {
      setError('Failed to connect to Stripe')
    } finally {
      setLoading(false)
    }
  }

  if (connected) {
    return (
      <div>
        <p className="text-sm text-ink-600">
          Customers can pay by card when they book. Funds deposit straight to your bank.
        </p>
        <div className="mt-2 text-xs text-ink-500">
          Account: <code className="font-mono text-ink-700">{accountId?.slice(0, 12)}...</code>
        </div>
        <a
          href="https://dashboard.stripe.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          Open Stripe dashboard
          <ExternalLinkIcon size={12} />
        </a>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-4 text-sm text-ink-600">
        Accept card, Apple Pay, and Google Pay payments. 1.5% + 25c per transaction. No monthly fee.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleConnect}
          disabled={loading}
          className="po-btn"
          style={{ background: '#635BFF', color: 'white' }}
        >
          {loading ? 'Connecting...' : 'Connect with Stripe'}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </div>
  )
}
