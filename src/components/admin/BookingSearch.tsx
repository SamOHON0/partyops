'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { SearchIcon, XIcon } from '@/components/ui/Icon'

export function BookingSearch({
  defaultValue,
  statusFilter,
  paymentFilter,
}: {
  defaultValue: string
  statusFilter: string
  paymentFilter: string
}) {
  const router = useRouter()
  const [value, setValue] = useState(defaultValue)
  const [isPending, startTransition] = useTransition()

  // Debounce navigation
  useEffect(() => {
    const t = setTimeout(() => {
      if (value === defaultValue) return
      const qs = new URLSearchParams()
      if (statusFilter) qs.set('status', statusFilter)
      if (paymentFilter) qs.set('payment', paymentFilter)
      if (value.trim()) qs.set('q', value.trim())
      const str = qs.toString()
      startTransition(() => {
        router.push(str ? `/admin/bookings?${str}` : '/admin/bookings')
      })
    }, 250)
    return () => clearTimeout(t)
  }, [value, defaultValue, statusFilter, paymentFilter, router])

  return (
    <div className="relative w-full sm:max-w-xs">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-400">
        <SearchIcon size={15} />
      </div>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search customer, email, item..."
        className="po-input pl-9 pr-9"
        aria-label="Search bookings"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue('')}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink-400 hover:text-ink-700"
          aria-label="Clear search"
        >
          <XIcon size={14} />
        </button>
      )}
      {isPending && (
        <div className="absolute -bottom-5 right-0 text-[10px] text-ink-400">
          Searching...
        </div>
      )}
    </div>
  )
}
