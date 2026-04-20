export function fmtCurrency(n: number, currency = 'EUR', locale = 'en-IE') {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
  } catch {
    return `€${Math.round(n)}`
  }
}

export function fmtCurrencyFull(n: number, currency = 'EUR', locale = 'en-IE') {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 2 }).format(n)
  } catch {
    return `€${n.toFixed(2)}`
  }
}

export function fmtDateShort(d: string | Date) {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })
}

export function fmtDateMedium(d: string | Date) {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function fmtDateLong(d: string | Date) {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export function daysBetween(start: string, end: string) {
  return Math.max(
    0,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000) + 1,
  )
}

export function relativeDays(d: string | Date) {
  const date = typeof d === 'string' ? new Date(d) : d
  const diff = Math.round((Date.now() - date.getTime()) / 86_400_000)
  if (diff === 0) return 'today'
  if (diff === 1) return 'yesterday'
  if (diff < 7) return `${diff} days ago`
  if (diff < 30) return `${Math.floor(diff / 7)} week${Math.floor(diff / 7) === 1 ? '' : 's'} ago`
  if (diff < 365) return `${Math.floor(diff / 30)} month${Math.floor(diff / 30) === 1 ? '' : 's'} ago`
  return `${Math.floor(diff / 365)} year${Math.floor(diff / 365) === 1 ? '' : 's'} ago`
}
