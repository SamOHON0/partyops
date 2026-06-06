import Link from 'next/link'

/**
 * PartyOps "Stacked Tiles" mark — two booking cards stacked, the front one
 * holding a date dot. Brand violet (#7C3AED) on light, light violet (#A78BFA)
 * back tile. See /brand for the full kit.
 */
export function LogoMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={(size * 98) / 96}
      viewBox="0 0 96 98"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect x="34" y="10" width="50" height="50" rx="14" fill="#A78BFA" />
      <path
        fill="#7C3AED"
        fillRule="evenodd"
        d="M12 46 a14 14 0 0 1 14 -14 h22 a14 14 0 0 1 14 14 v22 a14 14 0 0 1 -14 14 h-22 a14 14 0 0 1 -14 -14 Z M37 57 a11 11 0 1 0 0.01 0 Z"
      />
    </svg>
  )
}

/** White mark for dark backgrounds. */
export function LogoMarkWhite({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={(size * 98) / 96}
      viewBox="0 0 96 98"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect x="34" y="10" width="50" height="50" rx="14" fill="#FFFFFF" opacity="0.55" />
      <path
        fill="#FFFFFF"
        fillRule="evenodd"
        d="M12 46 a14 14 0 0 1 14 -14 h22 a14 14 0 0 1 14 14 v22 a14 14 0 0 1 -14 14 h-22 a14 14 0 0 1 -14 -14 Z M37 57 a11 11 0 1 0 0.01 0 Z"
      />
    </svg>
  )
}

/** Horizontal lockup: mark + "Party" (ink) + "Ops" (violet). */
export function LogoWordmark({
  className = '',
  white = false,
}: {
  className?: string
  white?: boolean
}) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${className}`}>
      {white ? <LogoMarkWhite size={30} /> : <LogoMark size={30} />}
      <span
        className={`text-[20px] font-extrabold ${white ? 'text-white' : 'text-ink-900'}`}
        style={{ letterSpacing: '-0.035em' }}
      >
        Party<span className="text-brand-600">Ops</span>
      </span>
    </Link>
  )
}
