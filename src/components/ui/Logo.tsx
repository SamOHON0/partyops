import Link from 'next/link'

export function LogoMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect width="32" height="32" rx="8" fill="url(#po-logo-grad)" />
      <path
        d="M10 21V11H15.2C16.9 11 18 12.1 18 13.6C18 15.1 16.9 16.2 15.2 16.2H12.4V21H10Z"
        fill="white"
      />
      <circle cx="21.5" cy="20.5" r="1.75" fill="#FDA4AF" />
      <defs>
        <linearGradient id="po-logo-grad" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#7C3AED" />
          <stop offset="1" stopColor="#4C1D95" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function LogoWordmark({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-tight text-ink-900">
        PartyOps
      </span>
    </Link>
  )
}
