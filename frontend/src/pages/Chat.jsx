// src/pages/Chat.jsx
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getMessages, sendMessage, markMessagesRead } from '../lib/chat'
import { timeAgo } from '../lib/utils'

export default function Chat() {
  const [params] = useSearchParams()
  const chatId     = params.get('listing_id')   // uuid used directly as chat room
  const ownerId    = params.get('owner_id')
  const ownerName  = params.get('owner_name')  || 'Owner'
  const buyerName  = params.get('buyer_name')  || 'Buyer'
  const title      = params.get('title')        || 'Listing'

  const [user, setUser]         = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText]         = useState('')
  const [loading, setLoading]   = useState(true)
  const [sending, setSending]   = useState(false)
  const [error, setError]       = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  useEffect(() => {
    if (!user || !chatId) return
    setLoading(true)
    getMessages(chatId)
      .then(msgs => { setMessages(msgs); markMessagesRead(chatId) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [user, chatId])

  useEffect(() => {
    if (!chatId) return
    const channel = supabase
      .channel(`chat_page_${chatId}`)
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim() || !chatId) return
    setSending(true)
    try {
      await sendMessage(chatId, text.trim())
      setText('')
    } catch (e) { setError(e.message) }
    finally { setSending(false) }
  }

  const otherName = user?.id === ownerId ? buyerName : ownerName

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f0a0a 0%,#0f172a 100%)', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: 'rgba(15,10,10,0.95)', borderBottom: '1px solid rgba(167,116,116,0.15)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '14px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg,#d4a0a0,#a77474)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: '#0f0a0a' }}>
          {otherName[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '15px', margin: 0 }}>{otherName}</p>
          <p style={{ color: '#475569', fontSize: '11px', margin: 0 }}>Re: {title}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
          <span style={{ color: '#4ade80', fontSize: '11px', fontWeight: 600 }}>Live</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid rgba(167,116,116,0.2)', borderTopColor: '#d4a0a0', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: '#475569', fontSize: '13px' }}>Loading chat...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ color: '#f87171', fontSize: '14px' }}>⚠️ {error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
            <p style={{ color: '#475569', fontSize: '14px' }}>No messages yet. Say hello!</p>
          </div>
        ) : messages.map((msg) => {
          const isMine = msg.sender_id === user?.id
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '72%', padding: '10px 14px', borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: isMine ? 'linear-gradient(135deg,#d4a0a0,#a77474)' : 'rgba(255,255,255,0.07)', border: isMine ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ color: isMine ? '#0f0a0a' : '#f1f5f9', fontSize: '14px', lineHeight: 1.5, margin: 0, wordBreak: 'break-word' }}>{msg.content}</p>
                <p style={{ color: isMine ? 'rgba(15,10,10,0.5)' : '#334155', fontSize: '10px', margin: '4px 0 0', textAlign: 'right' }}>
                  {timeAgo(msg.created_at)}{isMine && <span style={{ marginLeft: '4px' }}>{msg.is_read ? '✓✓' : '✓'}</span>}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{ background: 'rgba(15,10,10,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px' }}>
        {error && <p style={{ color: '#f87171', fontSize: '12px', marginBottom: '8px' }}>⚠️ {error}</p>}
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <textarea value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) } }}
            placeholder="Type a message..." rows={1}
            style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '10px 14px', color: '#f1f5f9', fontSize: '14px', outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, maxHeight: '120px' }}
          />
          <button type="submit" disabled={sending || !text.trim()}
            style={{ width: '44px', height: '44px', borderRadius: '50%', border: 'none', background: text.trim() ? 'linear-gradient(135deg,#d4a0a0,#a77474)' : 'rgba(255,255,255,0.06)', color: text.trim() ? '#0f0a0a' : '#334155', fontSize: '18px', cursor: text.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {sending ? '⏳' : '➤'}
          </button>
        </form>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
