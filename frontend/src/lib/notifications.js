// src/lib/notifications.js
import { supabase } from './supabase'

export async function getNotifications() {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) return []
  const { data, error } = await supabase
    .from('notifications').select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data || []
}

export async function markRead(id) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  if (error) throw error
}

export async function markAllRead() {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) return
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id)
  if (error) throw error
}

// Central helper — used by bookings.js, cropSales.js etc.
export async function sendNotification({ userId, title, message, type, data = {} }) {
  const { error } = await supabase.from('notifications').insert([{
    notification_id: `NOTIF_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    user_id: userId,
    title,
    message,
    type,
    data,
    is_read: false,
    created_at: new Date().toISOString(),
  }])
  if (error) throw error
}
