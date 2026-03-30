// src/lib/bookings.js
import { supabase } from './supabase'

// Create a booking
export async function createBooking(bookingData) {
    const { data: { user } } = await supabase.auth.getUser()
    
    const booking = {
        ...bookingData,
        booking_id: `BKG_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        buyer_id: user.id,
        buyer_name: user.user_metadata.name,
        buyer_phone: user.user_metadata.phone,
        status: 'pending',
        payment_status: 'pending',
        created_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
        .from('bookings')
        .insert([booking])
        .select()
        .single()
    
    if (error) throw error
    
    // Create notification for owner
    await supabase
        .from('notifications')
        .insert([{
            notification_id: `NOTIF_${Date.now()}`,
            user_id: bookingData.owner_id,
            title: 'New Booking Request',
            message: `${user.user_metadata.name} wants to book your item`,
            type: 'booking_request',
            data: { booking_id: data.booking_id },
            created_at: new Date().toISOString()
        }])
    
    return data
}

// Get my bookings (as buyer or owner)
export async function getMyBookings() {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
        .from('bookings')
        .select('*, listings:listing_id(*)')
        .or(`buyer_id.eq.${user.id},owner_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
}

// Update booking status
export async function updateBookingStatus(bookingId, status) {
    const updateData = { status }
    
    if (status === 'approved') updateData.approved_at = new Date().toISOString()
    if (status === 'completed') updateData.completed_at = new Date().toISOString()
    if (status === 'cancelled') updateData.cancelled_at = new Date().toISOString()
    
    const { data, error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('booking_id', bookingId)
        .select()
        .single()
    
    if (error) throw error
    
    // Send notification
    const { data: booking } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_id', bookingId)
        .single()
    
    const notifyUserId = status === 'approved' ? booking.buyer_id : booking.owner_id
    
    await supabase
        .from('notifications')
        .insert([{
            notification_id: `NOTIF_${Date.now()}`,
            user_id: notifyUserId,
            title: status === 'approved' ? 'Booking Confirmed!' : `Booking ${status}`,
            message: `Your booking has been ${status}`,
            type: `booking_${status}`,
            data: { booking_id: bookingId },
            created_at: new Date().toISOString()
        }])
    
    return data
}

