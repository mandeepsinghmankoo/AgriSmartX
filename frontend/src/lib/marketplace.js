// src/lib/marketplace.js
import { supabase } from './supabase'

export async function getMarketplaceProducts(filters = {}) {
  let query = supabase
    .from('marketplace')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (filters.category) query = query.eq('category', filters.category)
  if (filters.search) query = query.ilike('title', `%${filters.search}%`)
  if (filters.minPrice) query = query.gte('price', filters.minPrice)
  if (filters.maxPrice) query = query.lte('price', filters.maxPrice)
  if (filters.random) query = query.limit(20)

  const { data, error } = await query.limit(filters.limit || 40)
  if (error) throw error

  // Shuffle for random feel
  if (filters.random && data) {
    return data.sort(() => Math.random() - 0.5)
  }
  return data || []
}

export async function getProduct(productId) {
  const { data, error } = await supabase
    .from('marketplace')
    .select('*')
    .eq('product_id', productId)
    .single()
  if (error) throw error
  await supabase.from('marketplace').update({ views: (data.views || 0) + 1 }).eq('id', data.id)
  return data
}

export async function createProduct(productData) {
  const { data: { user } } = await supabase.auth.getUser()
  const product = {
    ...productData,
    product_id: `PRD_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    seller_id: user.id,
    seller_name: user.user_metadata?.name || '',
    created_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('marketplace').insert([product]).select().single()
  if (error) throw error
  return data
}
