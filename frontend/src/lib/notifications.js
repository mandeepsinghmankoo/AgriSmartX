// src/lib/notifications.js
import { supabase } from './supabase'

export async function getNotifications() {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('notifications').select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)
  if (error) throw error
  return data
}

export async function markRead(id) {
  await supabase.from('notifications').update({ is_read: true }).eq('id', id)
}

export async function markAllRead() {
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id)
}


