// src/components/common/NotificationToast.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { markRead } from '../../lib/notifications'

const TYPE_ICON = {
  booking_request:   '📥',
  booking_approved:  '✅',
  booking_rejected:  '❌',
  booking_completed: '🎉',
  booking_cancelled: '🚫',
  crop_interest:     '🤝',
  crop_accepted:     '✅',
  crop_rejected:     '❌',
  message_received:  '💬',
  default:           '🔔',
}

export default function NotificationToast() {
  const { user } = useAuth()
  const [toasts, setToasts] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return

    // Subscribe to new notifications for this user via Supabase Realtime
    const channel = supabase
      .channel(`notif_toast_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new
          const id = Date.now()
          setToasts(prev => [...prev, { id, notificationId: n.id, title: n.title, message: n.message, type: n.type, data: n.data }])
          // auto-dismiss after 5s
          setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  if (toasts.length === 0) return null

  async function openToast(toast) {
    setToasts(prev => prev.filter(item => item.id !== toast.id))
    if (toast.notificationId) await markRead(toast.notificationId)
    if (toast.data?.booking_id) {
      navigate(`/chat?booking_id=${encodeURIComponent(toast.data.booking_id)}`)
    } else if (toast.data?.chat_id) {
      navigate(`/chat?chat_id=${encodeURIComponent(toast.data.chat_id)}`)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: '72px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '340px',
      width: '100%',
    }}>
      {toasts.map(t => (
        <div
          key={t.id}
          className="animate-fade-down"
          style={{
            background: 'rgba(15,10,10,0.97)',
            border: '1px solid rgba(212,160,160,0.25)',
            borderRadius: '16px',
            padding: '14px 16px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(20px)',
            cursor: 'pointer',
          }}
          onClick={() => openToast(t).catch(error => {
            console.error('Could not open notification:', error)
            setToasts(prev => [...prev, {
              id: Date.now(),
              title: 'Could not open notification',
              message: error.message || 'Please try again.',
              type: 'default',
            }])
          })}
        >
          <span style={{ fontSize: '22px', flexShrink: 0, marginTop: '1px' }}>
            {TYPE_ICON[t.type] || TYPE_ICON.default}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '13px', marginBottom: '3px' }}>{t.title}</p>
            <p style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.4 }}>{t.message}</p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); setToasts(prev => prev.filter(x => x.id !== t.id)) }}
            style={{ background: 'none', border: 'none', color: '#334155', fontSize: '16px', cursor: 'pointer', flexShrink: 0, padding: '0 2px', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
