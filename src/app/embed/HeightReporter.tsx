'use client'

import { useEffect } from 'react'

/**
 * Posts the embed page's content height to the parent window so widget.js can
 * resize the iframe. Without this the iframe is stuck at its initial height
 * and taller content (expanded terms, product grids, error banners) gets
 * clipped behind an inner scrollbar.
 */
export default function HeightReporter() {
  useEffect(() => {
    if (window.top === window.self) return // not in an iframe

    let last = 0
    const report = () => {
      const height = document.documentElement.scrollHeight
      if (height !== last && height > 0) {
        last = height
        // widget.js validates the origin + message shape on its side.
        window.parent.postMessage({ type: 'partyops:height', height }, '*')
      }
    }

    report()
    const ro = new ResizeObserver(report)
    ro.observe(document.documentElement)
    ro.observe(document.body)
    window.addEventListener('load', report)

    return () => {
      ro.disconnect()
      window.removeEventListener('load', report)
    }
  }, [])

  return null
}
