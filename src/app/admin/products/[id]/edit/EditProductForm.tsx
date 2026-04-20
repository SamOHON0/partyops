'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase-client'
import Link from 'next/link'
import ImageUpload from '@/components/ImageUpload'

interface Product {
  id: string
  business_id: string
  name: string
  description: string | null
  price_per_day: number
  quantity_available: number
  delivery_fee: number | null
  image_url: string | null
}

export default function EditProductForm({
  product,
  action,
}: {
  product: Product
  action: (formData: FormData) => Promise<void>
}) {
  const [imageUrl, setImageUrl] = useState(product.image_url || '')
  const [businessId, setBusinessId] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setBusinessId(data.user.id)
    })
  }, [supabase.auth])

  return (
    <form action={action} className="po-card max-w-2xl space-y-5 p-6">
      <input type="hidden" name="image_url" value={imageUrl} />

      <Field name="name" label="Item name" defaultValue={product.name} required />
      <FieldTextarea
        name="description"
        label="Short description"
        hint="Shown to customers when picking this item."
        defaultValue={product.description ?? ''}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          name="price_per_day"
          label="Price per day (€)"
          defaultValue={String(product.price_per_day)}
          type="number"
          step="0.01"
          required
        />
        <Field
          name="quantity_available"
          label="Quantity"
          hint="If you own 2 of these, put 2."
          defaultValue={String(product.quantity_available)}
          type="number"
          required
        />
      </div>

      <Field
        name="delivery_fee"
        label="Delivery fee (€)"
        hint="Optional. Leave at 0 if delivery is free or quoted separately."
        defaultValue={String(product.delivery_fee ?? 0)}
        type="number"
        step="0.01"
      />

      {businessId && (
        <ImageUpload
          businessId={businessId}
          currentUrl={product.image_url}
          onUploaded={(url) => setImageUrl(url)}
        />
      )}

      <div className="flex items-center justify-end gap-2 border-t border-ink-100 pt-4">
        <Link href="/admin/products" className="po-btn po-btn-ghost">
          Cancel
        </Link>
        <button type="submit" className="po-btn po-btn-primary">
          Save changes
        </button>
      </div>
    </form>
  )
}

function Field({
  name,
  label,
  hint,
  defaultValue,
  type = 'text',
  step,
  required,
}: {
  name: string
  label: string
  hint?: string
  defaultValue?: string
  type?: string
  step?: string
  required?: boolean
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs font-medium text-ink-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        required={required}
        defaultValue={defaultValue}
        className="po-input"
      />
      {hint && <p className="mt-1 text-[11px] text-ink-500">{hint}</p>}
    </div>
  )
}

function FieldTextarea({
  name,
  label,
  hint,
  defaultValue,
}: {
  name: string
  label: string
  hint?: string
  defaultValue?: string
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs font-medium text-ink-700">
        {label}
      </label>
      <textarea id={name} name={name} rows={3} defaultValue={defaultValue} className="po-input" />
      {hint && <p className="mt-1 text-[11px] text-ink-500">{hint}</p>}
    </div>
  )
}
