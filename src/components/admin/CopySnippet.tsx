'use client'

import { useState } from 'react'
import { CopyIcon, CheckIcon } from '@/components/ui/Icon'

export function CopySnippet({
  value,
  language = 'text',
}: {
  value: string
  language?: string
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // noop
    }
  }

  return (
    <div className="relative">
      <pre
        className="overflow-x-auto rounded-xl bg-ink-900 px-4 py-3.5 text-xs text-ink-100"
        data-language={language}
      >
        <code>{value}</code>
      </pre>
      <button
        type="button"
        onClick={copy}
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-ink-800 px-2 py-1 text-[11px] font-medium text-ink-200 transition hover:bg-ink-700"
      >
        {copied ? (
          <>
            <CheckIcon size={12} />
            Copied
          </>
        ) : (
          <>
            <CopyIcon size={12} />
            Copy
          </>
        )}
      </button>
    </div>
  )
}
