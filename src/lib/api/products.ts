import { createServerComponentClient } from '@/lib/supabase'
import { Product } from '@/lib/types'

export async function getProducts(businessId: string): Promise<Product[]> {
  const supabase = await createServerComponentClient()

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getProduct(id: string): Promise<Product | null> {
  const supabase = await createServerComponentClient()

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
  const supabase = await createServerComponentClient()

  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  const supabase = await createServerComponentClient()

  const { data, error } = await supabase
    .from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = await createServerComponentClient()

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) throw error
}