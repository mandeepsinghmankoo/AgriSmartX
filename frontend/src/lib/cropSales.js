// src/lib/cropSales.js
import { supabase } from './supabase'

export async function createCropPost(data) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('name,phone').eq('id', user.id).single()
  const { data: row, error } = await supabase.from('crop_posts').insert({
    ...data,
    farmer_id: user.id,
    farmer_name: profile?.name || user.user_metadata?.name,
    farmer_phone: profile?.phone,
    status: 'open',
  }).select().single()
  if (error) throw error
  return row
}

export async function getCropPosts(filters = {}) {
  let q = supabase.from('crop_posts').select('*').eq('status', 'open').order('created_at', { ascending: false })
  if (filters.crop_type) q = q.eq('crop_type', filters.crop_type)
  if (filters.search)    q = q.ilike('title', `%${filters.search}%`)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

export async function getMyCropPosts() {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase.from('crop_posts').select('*').eq('farmer_id', user.id).order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function deleteCropPost(id) {
  const { error } = await supabase.from('crop_posts').delete().eq('id', id)
  if (error) throw error
}

export async function expressInterest(cropPostId, message) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('users').select('name,phone').eq('id', user.id).single()
  const { data, error } = await supabase.from('crop_interests').insert({
    crop_post_id: cropPostId,
    buyer_id: user.id,
    buyer_name: profile?.name || user.user_metadata?.name,
    buyer_phone: profile?.phone,
    message,
    status: 'pending',
  }).select().single()
  if (error) throw error
  return data
}

export async function getInterestsForPost(cropPostId) {
  const { data, error } = await supabase.from('crop_interests').select('*').eq('crop_post_id', cropPostId).order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getMyInterests() {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase.from('crop_interests').select('*, crop_posts(title,crop_type,farmer_name)').eq('buyer_id', user.id).order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function updateInterestStatus(interestId, status) {
  const { error } = await supabase.from('crop_interests').update({ status }).eq('id', interestId)
  if (error) throw error
}

export async function acceptInterest(cropPostId, interestId) {
  // Accept one, reject all others for this post
  const { error: e1 } = await supabase.from('crop_interests').update({ status: 'accepted' }).eq('id', interestId)
  if (e1) throw e1
  const { error: e2 } = await supabase.from('crop_interests').update({ status: 'rejected' }).eq('crop_post_id', cropPostId).neq('id', interestId)
  if (e2) throw e2
  const { error: e3 } = await supabase.from('crop_posts').update({ status: 'sold' }).eq('id', cropPostId)
  if (e3) throw e3
}
