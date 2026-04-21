// src/lib/chat.js
// We skip the `chats` table (RLS blocks inserts, no user-id columns).
// Instead we use listing_id (uuid) directly as the chat_id in messages.
// This gives one conversation thread per listing between the two parties.
import { supabase } from './supabase'

export async function getMessages(chatId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function sendMessage(chatId, content) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('messages')
    .insert([{
      chat_id:    chatId,
      sender_id:  user.id,
      content,
      is_read:    false,
      created_at: new Date().toISOString(),
    }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function markMessagesRead(chatId) {
  const { data: { user } } = await supabase.auth.getUser()
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('chat_id', chatId)
    .neq('sender_id', user.id)
}
