'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ImageUpload from '@/components/ImageUpload'
import { ArrowRightIcon } from '@/components/ui/Icon'

export default function NewProduct() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_per_day: '',
    quantity_available: '1',
    delivery_fee: '0',
    image_url: '',
    price_on_request: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [businessId, setBusinessId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setBusinessId(data.user.id)
    })
  }, [supabase.auth])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')

      const { error } = await supabase.from('products').insert({
        business_id: user.id,
        name: formData.name,
        description: formData.description || null,
        price_per_day: formData.price_on_request ? 0 : parseFloat(formData.price_per_day),
        quantity_available: parseInt(formData.quantity_available),
        delivery_fee: parseFloat(formData.delivery_fee || '0'),
        setup_time_buffer: 0,
        image_url: formData.image_url || null,
        price_on_request: formData.price_on_request,
      })

      if (error) throw error
      router.push('/admin/products')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

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
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Add an item</h1>
        <p className="mt-1 text-sm text-ink-500">
          Tell us a bit about it. You can change anything later.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="po-card max-w-2xl space-y-5 p-6">
        <Field label="Item name" htmlFor="name">
          <input
            type="text"
            name="name"
            id="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Princess bouncy castle"
            className="po-input"
          />
        </Field>

        <Field
          label="Short description"
          htmlFor="description"
          hint="Shown to customers when picking this item."
        >
          <textarea
            name="description"
            id="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            placeholder="A 12ft pink princess castle, suitable for kids up to 10."
            className="po-input"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Price per day (€)" htmlFor="price_per_day">
            <input
              type="number"
              name="price_per_day"
              id="price_per_day"
              required={!formData.price_on_request}
              disabled={formData.price_on_request}
              min="0"
              step="0.01"
              value={formData.price_per_day}
              onChange={handleChange}
              placeholder="120"
              className="po-input disabled:cursor-not-allowed disabled:opacity-50"
            />
          </Field>
          <Field
            label="Quantity"
            htmlFor="quantity_available"
            hint="If you own 2 of these, put 2."
          >
            <input
              type="number"
              name="quantity_available"
              id="quantity_available"
              required
              min="1"
              value={formData.quantity_available}
              onChange={handleChange}
              className="po-input"
            />
          </Field>
        </div>

        <label className="flex items-start gap-2.5 rounded-lg border border-ink-200 bg-ink-50/50 p-3 cursor-pointer hover:bg-ink-50">
          <input
            type="checkbox"
            name="price_on_request"
            checked={formData.price_on_request}
            onChange={handleChange}
            className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm">
            <span className="font-medium text-ink-900">Price on request</span>
            <span className="block text-xs text-ink-500 mt-0.5">
              Hide the price and date picker. Customer sees a "Call for price" badge and is prompted to contact you for a quote.
            </span>
          </span>
        </label>

        <Field
          label="Delivery fee (€)"
          htmlFor="delivery_fee"
          hint="Optional. Leave at 0 if delivery is free or quoted separately."
        >
          <input
            type="number"
            name="delivery_fee"
            id="delivery_fee"
            min="0"
            step="0.01"
            value={formData.delivery_fee}
            onChange={handleChange}
            className="po-input"
          />
        </Field>

        {businessId && (
          <ImageUpload
            businessId={businessId}
            onUploaded={(url) => setFormData((prev) => ({ ...prev, image_url: url }))}
          />
        )}

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-ink-100 pt-4">
          <Link href="/admin/products" className="po-btn po-btn-ghost">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="po-btn po-btn-primary">
            {loading ? 'Saving...' : 'Save item'}
          </button>
        </div>
      </form>
    </>
  )
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-ink-700">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-ink-500">{hint}</p>}
    </div>
  )
}
