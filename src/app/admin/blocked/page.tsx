import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerComponentClient } from '@/lib/supabase'
import { PageHeader, EmptyState } from '@/components/ui/PageHeader'
import { BlockIcon, TrashIcon, PlusIcon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { fmtDateLong } from '@/lib/format'

export const dynamic = 'force-dynamic'

type Block = {
  id: string
  product_id: string | null
  start_date: string
  end_date: string
  reason: string | null
  product?: { name: string } | null
}

async function addBlock(formData: FormData) {
  'use server'
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const productIdRaw = formData.get('product_id') as string

  if (productIdRaw && productIdRaw !== 'all') {
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('id', productIdRaw)
      .eq('business_id', user.id)
      .maybeSingle()
    if (!product) return
  }

  await supabase.from('blocked_dates').insert({
    business_id: user.id,
    product_id: productIdRaw === 'all' ? null : productIdRaw,
    start_date: formData.get('start_date') as string,
    end_date: formData.get('end_date') as string,
    reason: (formData.get('reason') as string) || null,
  })
  revalidatePath('/admin/blocked')
  revalidatePath('/admin/calendar')
}

async function removeBlock(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('blocked_dates').delete().eq('id', id).eq('business_id', user.id)
  revalidatePath('/admin/blocked')
  revalidatePath('/admin/calendar')
}

export default async function BlockedDatesPage() {
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: products } = await supabase
    .from('products')
    .select('id, name')
    .eq('business_id', user.id)
    .order('name')

  const { data: blocksRaw } = await supabase
    .from('blocked_dates')
    .select('id, product_id, start_date, end_date, reason, product:products(name)')
    .eq('business_id', user.id)
    .order('start_date', { ascending: true })

  const blocks = (blocksRaw ?? []) as unknown as Block[]
  const today = new Date().toISOString().slice(0, 10)

  return (
    <>
      <PageHeader
        title="Blocked dates"
        description="Close off dates when you can't take bookings. Works for holidays, maintenance, or when a single item is out of action."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Add form */}
        <form action={addBlock} className="po-card h-fit space-y-4 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            Add a block
          </h3>

          <div>
            <label htmlFor="product_id" className="mb-1.5 block text-xs font-medium text-ink-700">
              Apply to
            </label>
            <select id="product_id" name="product_id" defaultValue="all" className="po-input">
              <option value="all">All items (close whole business)</option>
              {(products ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="start_date" className="mb-1.5 block text-xs font-medium text-ink-700">
                From
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                required
                min={today}
                className="po-input"
              />
            </div>
            <div>
              <label htmlFor="end_date" className="mb-1.5 block text-xs font-medium text-ink-700">
                To
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                required
                min={today}
                className="po-input"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reason" className="mb-1.5 block text-xs font-medium text-ink-700">
              Reason (optional)
            </label>
            <input
              type="text"
              id="reason"
              name="reason"
              placeholder="e.g. Bank holiday, maintenance"
              className="po-input"
            />
          </div>

          <div className="flex justify-end">
            <button type="submit" className="po-btn po-btn-primary">
              <PlusIcon size={14} />
              Add block
            </button>
          </div>
        </form>

        {/* Current blocks */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">
            Current blocks ({blocks.length})
          </h3>
          {blocks.length === 0 ? (
            <EmptyState
              icon={<BlockIcon size={22} />}
              title="No blocked dates"
              description="All dates are currently open for booking."
            />
          ) : (
            <div className="po-card divide-y divide-ink-100">
              {blocks.map((b) => {
                const isPast = b.end_date < today
                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-ink-900">
                          {b.product_id ? b.product?.name || 'Item' : 'All items'}
                        </span>
                        {isPast && <Badge tone="neutral">Past</Badge>}
                      </div>
                      <div className="mt-0.5 text-xs text-ink-600">
                        {fmtDateLong(b.start_date)} to {fmtDateLong(b.end_date)}
                      </div>
                      {b.reason && (
                        <div className="mt-0.5 text-[11px] text-ink-500">{b.reason}</div>
                      )}
                    </div>
                    <form action={removeBlock}>
                      <input type="hidden" name="id" value={b.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-ink-400 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <TrashIcon size={12} />
                        Remove
                      </button>
                    </form>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
