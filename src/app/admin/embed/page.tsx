import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase'
import { headers } from 'next/headers'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmbedIcon, ExternalLinkIcon } from '@/components/ui/Icon'
import { CopySnippet } from '@/components/admin/CopySnippet'

export const dynamic = 'force-dynamic'

export default async function EmbedSnippetPage() {
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const h = await headers()
  const host = h.get('host') || 'localhost:3000'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`

  const snippet = `<script src="${baseUrl}/widget.js" data-business-id="${user.id}"></script>`
  const previewUrl = `${baseUrl}/embed/${user.id}`

  return (
    <>
      <PageHeader
        title="Embed"
        description="Drop your booking widget onto any website. It takes one line of code."
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="po-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                Embed code
              </h3>
              <div className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-brand-700">
                <EmbedIcon size={13} />
              </div>
            </div>
            <p className="mb-3 text-sm text-ink-600">
              Paste this into any page on your website. It loads in an iframe so it won't affect
              your existing styles.
            </p>
            <CopySnippet value={snippet} language="html" />
          </div>

          <div className="po-card p-5">
            <h3 className="mb-1 text-sm font-semibold text-ink-900">Quick test</h3>
            <p className="mb-3 text-xs text-ink-500">
              Preview the widget exactly as your customers will see it.
            </p>
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="po-btn po-btn-secondary"
            >
              Open hosted widget
              <ExternalLinkIcon size={14} />
            </a>
          </div>

          <div className="po-card p-5">
            <h3 className="mb-3 text-sm font-semibold text-ink-900">How to add it</h3>
            <ol className="space-y-2 text-sm text-ink-700">
              <Step n={1}>Log into your website's CMS (WordPress, Squarespace, Wix, etc.).</Step>
              <Step n={2}>Find the page where you want bookings. Edit it in HTML or Custom Code mode.</Step>
              <Step n={3}>Paste the snippet anywhere in the page body.</Step>
              <Step n={4}>Save and publish. The widget appears in seconds.</Step>
            </ol>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="po-card p-5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
              Your business ID
            </h3>
            <code className="block break-all rounded-lg border border-ink-100 bg-ink-50 px-2.5 py-2 font-mono text-[11px] text-ink-700">
              {user.id}
            </code>
            <p className="mt-2 text-[11px] text-ink-500">
              This ID links bookings from your site back to this account.
            </p>
          </div>

          <div className="po-card p-5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
              Works with
            </h3>
            <ul className="space-y-1.5 text-sm text-ink-700">
              {['WordPress', 'Squarespace', 'Wix', 'Webflow', 'Shopify', 'Any HTML site'].map(
                (name) => (
                  <li key={name} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                    {name}
                  </li>
                ),
              )}
            </ul>
          </div>
        </aside>
      </div>
    </>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold text-brand-700">
        {n}
      </span>
      <span className="text-sm text-ink-700">{children}</span>
    </li>
  )
}
