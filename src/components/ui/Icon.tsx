import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function base(props: IconProps) {
  const { size = 18, ...rest } = props
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...rest,
  }
}

export const HomeIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" /></svg>
)
export const BookingsIcon = (p: IconProps) => (
  <svg {...base(p)}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></svg>
)
export const CalendarIcon = (p: IconProps) => (
  <svg {...base(p)}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" /></svg>
)
export const InventoryIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M21 8 12 3 3 8v8l9 5 9-5V8z" /><path d="m3 8 9 5 9-5M12 13v8" /></svg>
)
export const UsersIcon = (p: IconProps) => (
  <svg {...base(p)}><circle cx="9" cy="8" r="4" /><path d="M2 20c.5-4 4-6 7-6s6.5 2 7 6" /><path d="M16 11a3 3 0 0 0 0-6M22 20c-.3-2.5-2-4.3-4-5.2" /></svg>
)
export const InvoiceIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M6 2h9l5 5v15H6V2z" /><path d="M14 2v6h6M9 13h6M9 17h4" /></svg>
)
export const EmbedIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="m8 18-6-6 6-6M16 6l6 6-6 6M14 4l-4 16" /></svg>
)
export const BillingIcon = (p: IconProps) => (
  <svg {...base(p)}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" /></svg>
)
export const SettingsIcon = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
)
export const BlockIcon = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="m5.6 5.6 12.8 12.8" /></svg>
)
export const PlusIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
)
export const ArrowRightIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
)
export const SearchIcon = (p: IconProps) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
)
export const CheckIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="m5 12 5 5 9-11" /></svg>
)
export const XIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M18 6 6 18M6 6l12 12" /></svg>
)
export const ClockIcon = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
)
export const TrendingUpIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 17 9 11l4 4 8-8" /><path d="M14 5h7v7" /></svg>
)
export const BoltIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M13 2 3 14h8l-1 8 10-12h-8l1-8z" /></svg>
)
export const SparklesIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></svg>
)
export const ShieldIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3z" /></svg>
)
export const ChevronDownIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="m6 9 6 6 6-6" /></svg>
)
export const MenuIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 6h16M4 12h16M4 18h16" /></svg>
)
export const EuroIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M19 5a9 9 0 1 0 0 14" /><path d="M4 10h11M4 14h11" /></svg>
)
export const MailIcon = (p: IconProps) => (
  <svg {...base(p)}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 7 9-7" /></svg>
)
export const PhoneIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 20 20 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A20 20 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L7.9 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2z" /></svg>
)
export const MapPinIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 22s-8-7-8-13a8 8 0 1 1 16 0c0 6-8 13-8 13z" /><circle cx="12" cy="9" r="3" /></svg>
)
export const ZapIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M11 2 3 14h7l-1 8 10-12h-7l1-8z" /></svg>
)
export const CopyIcon = (p: IconProps) => (
  <svg {...base(p)}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
)
export const DownloadIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 3v12M6 11l6 6 6-6M4 21h16" /></svg>
)
export const PrintIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M6 9V2h12v7" /><rect x="3" y="9" width="18" height="8" rx="2" /><path d="M6 17h12v5H6z" /></svg>
)
export const EditIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
)
export const TrashIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6" /></svg>
)
export const ExternalLinkIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M15 3h6v6M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" /></svg>
)
