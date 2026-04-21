// src/lib/notifications.js
import { supabase } from './supabase'

export async function getNotifications() {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('notifications').select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data || []
}

export async function markRead(id) {
  await supabase.from('notifications').update({ is_read: true }).eq('id', id)
}

export async function markAllRead() {
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id)
}

// Central helper — used by bookings.js, cropSales.js etc.
export async function sendNotification({ userId, title, message, type, data = {} }) {
  await supabase.from('notifications').insert([{
    notification_id: `NOTIF_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    user_id: userId,
    title,
    message,
    type,
    data,
    is_read: false,
    created_at: new Date().toISOString(),
  }])
}
