// src/lib/reviews.js
import { supabase } from './supabase'

export async function addReview({ listing_id, owner_id, booking_id, rating, comment }) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase.from('reviews').insert([{
    review_id: `REV_${Date.now()}`,
    listing_id, owner_id, booking_id,
    reviewer_id: user.id,
    reviewer_name: user.user_metadata.name,
    rating, comment,
    created_at: new Date().toISOString()
  }]).select().single()
  if (error) throw error
  return data
}

export async function getListingReviews(listing_id) {
  const { data, error } = await supabase
    .from('reviews').select('*')
    .eq('listing_id', listing_id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}


