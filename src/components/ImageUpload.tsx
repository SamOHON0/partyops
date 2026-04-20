'use client'

import { useState, useRef, useCallback } from 'react'
import { createClientComponentClient } from '@/lib/supabase-client'

interface ImageUploadProps {
  businessId: string
  currentUrl?: string | null
  onUploaded: (url: string) => void
}

function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Compression failed'))),
        'image/webp',
        quality
      )
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

export default function ImageUpload({ businessId, currentUrl, onUploaded }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClientComponentClient()

  const upload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB')
      return
    }

    setError('')
    setUploading(true)

    try {
      // Show local preview immediately
      const localPreview = URL.createObjectURL(file)
      setPreview(localPreview)

      // Compress
      const compressed = await compressImage(file)
      const fileName = `${businessId}/${Date.now()}.webp`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, compressed, {
          contentType: 'image/webp',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)

      onUploaded(data.publicUrl)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setPreview(currentUrl || null)
    } finally {
      setUploading(false)
    }
  }, [businessId, currentUrl, onUploaded, supabase.storage])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) upload(file)
  }, [upload])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) upload(file)
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-ink-700">Photo</label>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`
          relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-all
          ${dragOver ? 'border-brand-400 bg-brand-50' : 'border-ink-200 hover:border-brand-300 hover:bg-ink-50'}
          ${preview ? 'aspect-[16/10]' : 'py-8'}
        `}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="h-full w-full object-cover" />
            <div className="group absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/30">
              <span className="rounded-lg bg-black/60 px-3 py-1.5 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                {uploading ? 'Uploading...' : 'Change photo'}
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-ink-400">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            <p className="text-sm font-medium text-ink-600">
              {uploading ? 'Uploading...' : 'Click or drag a photo'}
            </p>
            <p className="text-xs text-ink-500">JPG, PNG, WEBP up to 10MB</p>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      <p className="mt-1 text-[11px] text-ink-500">Auto-compressed for fast loading. Optional.</p>
    </div>
  )
}
