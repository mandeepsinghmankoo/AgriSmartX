// src/lib/chat.js
import { supabase } from './supabase'

export async function openBookingChat(bookingId) {
  const { data, error } = await supabase.rpc('open_booking_chat', {
    p_booking_id: bookingId,
  })
  if (error) throw error
  if (!data) throw new Error('Could not open the chat for this booking.')
  return data
}

export async function getMessages(chatId) {
  const { data, error } = await supabase
    .from('messages')
    .select('id, chat_id, sender_id, sender_name, message_type, content, is_read, created_at')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function sendMessage(chatId, content) {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) throw new Error('You must be signed in to send a message.')

  const senderName = user.user_metadata?.name || user.user_metadata?.full_name || user.email || user.id
  const { data, error } = await supabase
    .from('messages')
    .insert([{
      chat_id:   chatId,
      sender_id: user.id,
      sender_name: senderName,
      message_type: 'text',
      content,
      is_read:   false,
    }])
    .select('id, chat_id, sender_id, sender_name, message_type, content, is_read, created_at')
    .single()
  if (error) throw error
  return data
}

export async function markMessagesRead(chatId) {
  const { data: { user } } = await supabase.auth.getUser()
  // fire-and-forget — ignore errors so it never blocks the UI
  supabase
    .from('messages')
    .update({ is_read: true })
    .eq('chat_id', chatId)
    .neq('sender_id', user.id)
    .then(() => {})
    .catch(() => {})
}
