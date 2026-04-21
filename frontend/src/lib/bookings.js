// src/lib/bookings.js
import { supabase } from './supabase'
import { sendNotification } from './notifications'

export async function createBooking(bookingData) {
  const { data: { user } } = await supabase.auth.getUser()

  // listing_id in bookings table is a uuid FK to listings.id — pass the uuid, not the custom string
  const { listing_id, listing_ref, ...rest } = bookingData

  const booking = {
    ...rest,
    listing_id,   // must be the uuid (listings.id), already set correctly by caller
    booking_id: `BKG_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    buyer_id: user.id,
    buyer_name: user.user_metadata?.name || '',
    buyer_phone: user.user_metadata?.phone || '',
    status: 'pending',
    payment_status: 'pending',
    created_at: new Date().toISOString(),
  }

  // Strip empty strings so Postgres timestamp/nullable columns don't get invalid input
  const clean = Object.fromEntries(
    Object.entries(booking).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )

  const { data, error } = await supabase
    .from('bookings')
    .insert([clean])
    .select()
    .single()

  if (error) throw error

  // Notify the owner
  await sendNotification({
    userId: bookingData.owner_id,
    title: 'New Booking Request 📥',
    message: `${booking.buyer_name} wants to book your ${bookingData.listing_type || 'listing'}`,
    type: 'booking_request',
    data: { booking_id: data.booking_id },
  })

  return data
}

export async function getMyBookings() {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .or(`buyer_id.eq.${user.id},owner_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function updateBookingStatus(bookingId, status) {
  const updateData = { status }
  if (status === 'approved')   updateData.approved_at   = new Date().toISOString()
  if (status === 'completed')  updateData.completed_at  = new Date().toISOString()
  if (status === 'cancelled')  updateData.cancelled_at  = new Date().toISOString()
  if (status === 'rejected')   updateData.rejected_at   = new Date().toISOString()

  const { data, error } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('booking_id', bookingId)
    .select()
    .single()

  if (error) throw error

  // Fetch full booking to get both user IDs
  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('booking_id', bookingId)
    .single()

  if (booking) {
    const MESSAGES = {
      approved:  { to: 'buyer',  title: 'Booking Confirmed! ✅', message: `Your ${booking.listing_type} booking has been approved` },
      rejected:  { to: 'buyer',  title: 'Booking Rejected ❌',   message: `Your ${booking.listing_type} booking was rejected by the owner` },
      completed: { to: 'buyer',  title: 'Booking Completed 🎉',  message: `Your ${booking.listing_type} booking is marked as completed` },
      cancelled: { to: 'owner',  title: 'Booking Cancelled 🚫',  message: `${booking.buyer_name} cancelled their booking request` },
    }
    const m = MESSAGES[status]
    if (m) {
      await sendNotification({
        userId: m.to === 'buyer' ? booking.buyer_id : booking.owner_id,
        title: m.title,
        message: m.message,
        type: `booking_${status}`,
        data: { booking_id: bookingId },
      })
    }
  }

  return data
}
