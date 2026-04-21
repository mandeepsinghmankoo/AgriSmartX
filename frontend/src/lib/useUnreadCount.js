// src/lib/useUnreadCount.js
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from '../contexts/AuthContext'

export function useUnreadCount() {
  const { user } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!user) return

    // Initial fetch
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .then(({ count: c }) => setCount(c || 0))

    // Realtime: increment on new insert, decrement on update to is_read=true
    const channel = supabase
      .channel(`unread_count_${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => setCount(c => c + 1)
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => { if (payload.new.is_read && !payload.old.is_read) setCount(c => Math.max(0, c - 1)) }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user])

  return count
}
