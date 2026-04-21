// src/components/common/ChatPanel.jsx
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { getMessages, sendMessage, markMessagesRead } from '../../lib/chat'
import { timeAgo } from '../../lib/utils'

export default function ChatPanel({ booking, onClose }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [text, setText]         = useState('')
  const [loading, setLoading]   = useState(true)
  const [sending, setSending]   = useState(false)
  const [error, setError]       = useState('')
  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)

  // Use listing_id (uuid) directly as the chat room ID
  const chatId = booking.listing_id || null

  const isOwner   = user?.id === booking.owner_id
  const otherName = isOwner ? (booking.buyer_name || 'Buyer') : (booking.owner_name || 'Owner')
  const title     = booking.listing_type || booking.title || 'Listing'

  // Load messages using listing_id as chatId
  useEffect(() => {
    if (!user || !chatId) {
      setError(!chatId ? 'No listing linked to this booking.' : '')
      setLoading(false)
      return
    }
    setLoading(true)
    getMessages(chatId)
      .then(msgs => { setMessages(msgs); markMessagesRead(chatId) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [user, chatId])

  // Realtime subscription on messages for this chatId
  useEffect(() => {
    if (!chatId) return
    const channel = supabase
      .channel(`chatpanel_${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `chat_id=eq.${chatId}`,
      }, (payload) => {
        setMessages(prev => prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new])
        markMessagesRead(chatId)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [chatId])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when panel opens
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim() || !chatId) return
    setSending(true)
    setError('')
    try {
      await sendMessage(chatId, text.trim())
      setText('')
    } catch (e) { setError(e.message) }
    finally { setSending(false) }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, backdropFilter: 'blur(4px)' }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        right: 0, top: 0, bottom: 0,
        width: '100%', maxWidth: '420px',
        background: 'linear-gradient(180deg,#0f0a0a 0%,#0f172a 100%)',
        borderLeft: '1px solid rgba(167,116,116,0.15)',
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.6)',
        animation: 'slideInRight 0.25s ease',
      }}>

        {/* Header */}
        <div style={{
          padding: '16px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', gap: '12px',
          background: 'rgba(15,10,10,0.8)',
          backdropFilter: 'blur(20px)',
          flexShrink: 0,
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'linear-gradient(135deg,#d4a0a0,#a77474)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: 700, color: '#0f0a0a', flexShrink: 0,
          }}>
            {otherName[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '14px', margin: 0 }}>{otherName}</p>
            <p style={{ color: '#475569', fontSize: '11px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Re: {title}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 6px #4ade80' }} />
              <span style={{ color: '#4ade80', fontSize: '10px', fontWeight: 600 }}>Live</span>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Booking context pill */}
        <div style={{ padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(212,160,160,0.08)', border: '1px solid rgba(212,160,160,0.15)', borderRadius: '20px', padding: '4px 12px' }}>
            <span style={{ fontSize: '11px' }}>📋</span>
            <span style={{ color: '#d4a0a0', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize' }}>{title} Booking</span>
            <span style={{ color: '#334155', fontSize: '10px' }}>· {booking.status}</span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid rgba(167,116,116,0.2)', borderTopColor: '#d4a0a0', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
              <p style={{ color: '#475569', fontSize: '13px' }}>Loading chat...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '30px 20px' }}>
              <p style={{ color: '#f87171', fontSize: '13px' }}>⚠️ {error}</p>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '44px', marginBottom: '10px' }}>💬</div>
              <p style={{ color: '#475569', fontSize: '13px' }}>No messages yet.</p>
              <p style={{ color: '#334155', fontSize: '12px', marginTop: '4px' }}>Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === user?.id
              return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '78%',
                    padding: '9px 13px',
                    borderRadius: isMine ? '16px 16px 3px 16px' : '16px 16px 16px 3px',
                    background: isMine ? 'linear-gradient(135deg,#d4a0a0,#a77474)' : 'rgba(255,255,255,0.07)',
                    border: isMine ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <p style={{ color: isMine ? '#0f0a0a' : '#f1f5f9', fontSize: '13px', lineHeight: 1.5, margin: 0, wordBreak: 'break-word' }}>
                      {msg.content}
                    </p>
                    <p style={{ color: isMine ? 'rgba(15,10,10,0.45)' : '#334155', fontSize: '10px', margin: '3px 0 0', textAlign: 'right' }}>
                      {timeAgo(msg.created_at)}
                      {isMine && <span style={{ marginLeft: '3px' }}>{msg.is_read ? '✓✓' : '✓'}</span>}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(15,10,10,0.6)', flexShrink: 0 }}>
          {error && !loading && <p style={{ color: '#f87171', fontSize: '11px', marginBottom: '6px' }}>⚠️ {error}</p>}
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) } }}
              placeholder="Type a message... (Enter to send)"
              rows={1}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '14px',
                padding: '10px 14px',
                color: '#f1f5f9',
                fontSize: '13px',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                maxHeight: '100px',
                overflowY: 'auto',
              }}
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              style={{
                width: '42px', height: '42px', borderRadius: '50%', border: 'none', flexShrink: 0,
                background: text.trim() ? 'linear-gradient(135deg,#d4a0a0,#a77474)' : 'rgba(255,255,255,0.06)',
                color: text.trim() ? '#0f0a0a' : '#334155',
                fontSize: '16px', cursor: text.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              {sending ? '⏳' : '➤'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </>
  )
}
