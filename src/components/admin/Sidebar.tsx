'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LogoMark } from '@/components/ui/Logo'
import {
  HomeIcon,
  BookingsIcon,
  CalendarIcon,
  InventoryIcon,
  UsersIcon,
  InvoiceIcon,
  BlockIcon,
  EmbedIcon,
  BillingIcon,
  SettingsIcon,
  MenuIcon,
  XIcon,
} from '@/components/ui/Icon'

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Workspace',
    items: [
      { href: '/admin', label: 'Dashboard', icon: HomeIcon, exact: true },
      { href: '/admin/bookings', label: 'Bookings', icon: BookingsIcon },
      { href: '/admin/calendar', label: 'Calendar', icon: CalendarIcon },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/admin/products', label: 'Items', icon: InventoryIcon },
      { href: '/admin/customers', label: 'Customers', icon: UsersIcon },
      { href: '/admin/invoices', label: 'Invoices', icon: InvoiceIcon },
      { href: '/admin/blocked', label: 'Blocked dates', icon: BlockIcon },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/admin/embed', label: 'Embed', icon: EmbedIcon },
      { href: '/admin/billing', label: 'Billing', icon: BillingIcon },
      { href: '/admin/settings', label: 'Settings', icon: SettingsIcon },
    ],
  },
]

type NavItem = {
  href: string
  label: string
  icon: (p: { size?: number }) => React.ReactElement
  exact?: boolean
}

export function Sidebar({
  businessName,
  initials,
  userEmail,
}: {
  businessName: string
  initials: string
  userEmail: string
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const content = (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-2 pt-5">
        <Link href="/admin" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <LogoMark size={26} />
          <span className="text-[15px] font-semibold tracking-tight text-ink-900">PartyOps</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
              {group.label}
            </div>
            <ul className="mt-2 space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition ${
                        isActive
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                      }`}
                    >
                      <Icon size={16} />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-ink-100 p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-ink-900">{businessName}</div>
            <div className="truncate text-[11px] text-ink-500">{userEmail}</div>
          </div>
          <form action="/admin/logout" method="post">
            <button
              type="submit"
              title="Sign out"
              className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-ink-100 bg-white lg:block">
        {content}
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-ink-100 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <LogoMark size={22} />
          <span className="text-sm font-semibold">PartyOps</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-md p-2 text-ink-600 hover:bg-ink-100"
          aria-label="Open menu"
        >
          <MenuIcon size={18} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-900/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl">
            <div className="flex items-center justify-end px-3 pt-3">
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-2 text-ink-500 hover:bg-ink-100"
                aria-label="Close menu"
              >
                <XIcon size={18} />
              </button>
            </div>
            {content}
          </aside>
        </div>
      )}
    </>
  )
}
