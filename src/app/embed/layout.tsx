import type { ReactNode } from 'react'
import HeightReporter from './HeightReporter'

export default function EmbedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white min-h-screen">
      <HeightReporter />
      {children}
    </div>
  )
}
