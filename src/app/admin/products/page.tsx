import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerComponentClient } from '@/lib/supabase'
import { getProducts } from '@/lib/api/products'
import { PageHeader, EmptyState } from '@/components/ui/PageHeader'
import {
  InventoryIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
} from '@/components/ui/Icon'
import { fmtCurrency } from '@/lib/format'

export const dynamic = 'force-dynamic'

async function deleteProduct(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('products').delete().eq('id', id).eq('business_id', user.id)
  revalidatePath('/admin/products')
}

export default async function AdminProducts() {
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const products = await getProducts(user.id)

  return (
    <>
      <PageHeader
        title="Items"
        description="Add, edit, and manage the items customers can book."
        actions={
          <Link href="/admin/products/new" className="po-btn po-btn-primary">
            <PlusIcon size={16} />
            Add item
          </Link>
        }
      />

      {products.length === 0 ? (
        <EmptyState
          icon={<InventoryIcon size={22} />}
          title="No items yet"
          description="Add your first rentable item and customers will be able to book it through your widget."
          action={
            <Link href="/admin/products/new" className="po-btn po-btn-primary">
              <PlusIcon size={16} />
              Add your first item
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="group po-card overflow-hidden transition hover:shadow-md"
            >
              <div className="aspect-[16/10] overflow-hidden bg-ink-100">
                {product.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    src={product.image_url}
                    alt={product.name}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-ink-300">
                    <InventoryIcon size={36} />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="min-w-0 truncate text-sm font-semibold text-ink-900">
                    {product.name}
                  </h3>
                  <span className="shrink-0 rounded-full border border-ink-200 bg-ink-50 px-2 py-0.5 text-[10px] font-medium text-ink-600">
                    {product.quantity_available} in stock
                  </span>
                </div>
                <div className="mt-1 text-sm font-medium text-brand-700">
                  {fmtCurrency(Number(product.price_per_day))}/day
                </div>
                {product.description && (
                  <p className="mt-2 line-clamp-2 text-xs text-ink-500">
                    {product.description}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3">
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    <EditIcon size={12} />
                    Edit
                  </Link>
                  <form action={deleteProduct}>
                    <input type="hidden" name="id" value={product.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 text-xs font-medium text-ink-400 transition hover:text-rose-600"
                    >
                      <TrashIcon size={12} />
                      Remove
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
