// src/lib/listings.js
import { supabase } from './supabase'

// Only columns that exist in the listings table
const ALLOWED_COLUMNS = [
  'listing_id', 'title', 'type', 'category', 'description', 'price', 'price_unit',
  'rent_or_sell', 'owner_id', 'owner_name', 'owner_phone', 'owner_rating',
  'location', 'state', 'pincode', 'latitude', 'longitude', 'address',
  'images', 'video', 'availability', 'status', 'views', 'created_at',
  // equipment
  'equipment_model', 'manufacturer', 'year', 'hours_used', 'fuel_type',
  'horsepower', 'equipment_condition', 'attachments', 'insurance_available',
  'delivery_available', 'operator_included', 'operator_price',
  // land
  'area', 'soil_type', 'water_availability', 'irrigation_system',
  'electricity_available', 'fencing', 'road_access', 'previous_crops',
  'current_crop', 'lease_duration', 'minimum_lease', 'land_documents',
  // livestock
  'animal_type', 'breed', 'age', 'gender', 'weight', 'health_status',
  'vaccination_records', 'last_vaccination', 'next_vaccination',
  'milk_yield', 'pregnancy_status', 'due_date', 'medical_history',
  // labor
  'skills', 'experience', 'hourly_rate', 'daily_rate', 'monthly_rate',
  'availability_days', 'availability_hours', 'languages', 'aadhar_verified',
  'reference_contact', 'distance_will_travel', 'own_transport', 'certificates',
  // product (seller)
  'brand', 'stock_available', 'quantity', 'quantity_unit', 'expiry_date',
]

function pickAllowed(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([k, v]) =>
      ALLOWED_COLUMNS.includes(k) && v !== '' && v !== null && v !== undefined
    )
  )
}

export async function createListing(listingData) {
  const { data: { user } } = await supabase.auth.getUser()

  const raw = {
    ...listingData,
    listing_id: `LST_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    owner_id: user.id,
    owner_name: user.user_metadata?.name || '',
    owner_phone: user.user_metadata?.phone || '',
    created_at: new Date().toISOString(),
  }

  const listing = pickAllowed(raw)

  const { data, error } = await supabase
    .from('listings')
    .insert([listing])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getListings(filters = {}) {
  let query = supabase
    .from('listings')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (filters.type) query = query.eq('type', filters.type)
  if (filters.category) query = query.eq('category', filters.category)
  if (filters.minPrice) query = query.gte('price', filters.minPrice)
  if (filters.maxPrice) query = query.lte('price', filters.maxPrice)
  if (filters.location) query = query.ilike('location', `%${filters.location}%`)

  const { data, error } = await query.limit(50)
  if (error) throw error
  return data
}

export async function getListing(listingId) {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('listing_id', listingId)
    .single()

  if (error) throw error

  await supabase
    .from('listings')
    .update({ views: (data.views || 0) + 1 })
    .eq('id', data.id)

  return data
}

export async function getMyListings() {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function updateListing(listingId, updates) {
  const { data, error } = await supabase
    .from('listings')
    .update(pickAllowed(updates))
    .eq('listing_id', listingId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteListing(listingId) {
  const { error } = await supabase
    .from('listings')
    .update({ status: 'deleted' })
    .eq('listing_id', listingId)

  if (error) throw error
  return true
}
