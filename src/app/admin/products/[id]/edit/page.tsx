import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerComponentClient } from '@/lib/supabase'
import { ArrowRightIcon } from '@/components/ui/Icon'
import EditProductForm from './EditProductForm'

export const dynamic = 'force-dynamic'

async function updateProduct(id: string, formData: FormData) {
  'use server'
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const priceOnRequest = formData.get('price_on_request') === 'true'
  // Guard against NaN from non-numeric input: NaN would either be rejected by
  // Postgres or corrupt availability/pricing maths downstream.
  const price = parseFloat((formData.get('price_per_day') as string) || '0')
  const qty = parseInt((formData.get('quantity_available') as string) || '1', 10)
  const deliveryFee = parseFloat((formData.get('delivery_fee') as string) || '0')
  // Always store the entered price (even when price_on_request is true) so admins
  // can toggle the flag back off without losing the underlying value. Customer-facing
  // widgets check the boolean and ignore the price when it's true.
  await supabase
    .from('products')
    .update({
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || null,
      price_per_day: Number.isFinite(price) && price >= 0 ? price : 0,
      quantity_available: Number.isFinite(qty) && qty >= 0 ? qty : 1,
      delivery_fee: Number.isFinite(deliveryFee) && deliveryFee >= 0 ? deliveryFee : 0,
      image_url: (formData.get('image_url') as string) || null,
      price_on_request: priceOnRequest,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('business_id', user.id)
  revalidatePath('/admin/products')
  redirect('/admin/products')
}

export default async function EditProduct({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  // Products are world-readable via the "Public can view products" RLS policy,
  // so scope the read to this business or any logged-in user could view
  // another operator's product in the edit form.
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('business_id', user.id)
    .single()
  if (!product) notFound()

  const action = updateProduct.bind(null, id)

  return (
    <>
      <div className="mb-2">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-900"
        >
          <span className="rotate-180">
            <ArrowRightIcon size={12} />
          </span>
          All items
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Edit item</h1>
        <p className="mt-1 text-sm text-ink-500">Update the details for this item.</p>
      </div>

      <EditProductForm product={product} action={action} />
    </>
  )
}
