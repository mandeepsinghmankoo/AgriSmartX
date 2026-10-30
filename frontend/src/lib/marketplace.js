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

export async function getMyMarketplaceProducts() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be signed in to view your products')

  const { data, error } = await supabase
    .from('marketplace')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
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

export async function placeMarketplaceOrder({ productId, quantity, buyerName, buyerPhone, deliveryAddress }) {
  const { data, error } = await supabase.rpc('place_marketplace_order', {
    p_product_id: productId,
    p_quantity: quantity,
    p_buyer_name: buyerName,
    p_buyer_phone: buyerPhone,
    p_delivery_address: deliveryAddress,
  })
  if (error) throw error
  return data
}

export async function getMyMarketplaceOrders() {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) throw new Error('You must be signed in to view orders')

  const { data, error } = await supabase
    .from('marketplace_orders')
    .select('*')
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getMarketplaceOrderEvents(orderIds) {
  if (!orderIds.length) return []
  const { data, error } = await supabase
    .from('marketplace_order_events')
    .select('*')
    .in('order_id', orderIds)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function updateMarketplaceOrderStatus(orderId, status) {
  const { data, error } = await supabase.rpc('update_marketplace_order_status', {
    p_order_id: orderId,
    p_status: status,
  })
  if (error) throw error
  return data
}

export async function getMarketplaceReviews(productId) {
  const { data, error } = await supabase
    .from('marketplace_reviews')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getMyMarketplaceOrderReviews(orderIds) {
  if (!orderIds.length) return []
  const { data, error } = await supabase
    .from('marketplace_reviews')
    .select('*')
    .in('order_id', orderIds)
  if (error) throw error
  return data || []
}

export async function createMarketplaceReview(orderId, rating, review) {
  const { data, error } = await supabase.rpc('create_marketplace_review', {
    p_order_id: orderId,
    p_rating: rating,
    p_review: review,
  })
  if (error) throw error
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
