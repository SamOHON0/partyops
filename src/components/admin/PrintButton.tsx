'use client'

import { PrintIcon } from '@/components/ui/Icon'

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="po-btn po-btn-secondary"
    >
      <PrintIcon size={14} />
      Print
    </button>
  )
}
