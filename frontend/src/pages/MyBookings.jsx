// src/pages/MyBookings.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyBookings, updateBookingStatus } from '../lib/bookings'
import { useAuth } from '../contexts/AuthContext'
import { formatPrice, formatDate } from '../lib/utils'

const STATUS_STYLE = {
  pending: { bg: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: 'rgba(245,158,11,0.2)', dot: '#f59e0b' },
  approved: { bg: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: 'rgba(59,130,246,0.2)', dot: '#3b82f6' },
  completed: { bg: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: 'rgba(139,92,246,0.2)', dot: '#8b5cf6' },
  cancelled: { bg: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'rgba(239,68,68,0.2)', dot: '#ef4444' },
  rejected: { bg: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'rgba(239,68,68,0.2)', dot: '#ef4444' },
}

export default function MyBookings() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('buyer')
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    getMyBookings().then(setBookings).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function handleStatus(bookingId, status) {
    setActionLoading(bookingId + status)
    try {
      await updateBookingStatus(bookingId, status)
      setBookings((bs) => bs.map((b) => b.booking_id === bookingId ? { ...b, status } : b))
    } catch (err) { alert(err.message) }
    finally { setActionLoading(null) }
  }

  const myId = user?.id
  const filtered = bookings.filter((b) => tab === 'buyer' ? b.buyer_id === myId : b.owner_id === myId)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: '3px solid rgba(167, 116, 116,0.2)', borderTopcolor: '#d4a0a0', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#475569', fontSize: '14px' }}>Loading bookings...</p>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <p style={{ color: '#d4a0a0', fontSize: '12px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>BOOKINGS</p>
        <h1 style={{ color: '#f1f5f9', fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.3px' }}>My Bookings</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '4px', marginBottom: '28px', width: 'fit-content' }}>
        {[
          { id: 'buyer', label: '🛒 My Requests', count: bookings.filter((b) => b.buyer_id === myId).length },
          { id: 'owner', label: '📋 Received', count: bookings.filter((b) => b.owner_id === myId).length },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
              border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              background: tab === t.id ? 'linear-gradient(135deg,#d4a0a0,#a77474)' : 'transparent',
              color: tab === t.id ? '#0f0a0a' : '#64748b',
              boxShadow: tab === t.id ? '0 4px 12px rgba(167, 116, 116,0.25)' : 'none',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
            {t.label}
            <span style={{
              background: tab === t.id ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.08)',
              color: tab === t.id ? '#0f0a0a' : '#475569',
              borderRadius: '10px', padding: '1px 7px', fontSize: '11px', fontWeight: 700,
            }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>📭</div>
          <h3 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No bookings yet</h3>
          {tab === 'buyer' && (
            <Link to="/listings" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '16px', padding: '10px 24px' }}>
              Browse Listings →
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filtered.map((b) => {
            const ss = STATUS_STYLE[b.status] || STATUS_STYLE.pending
            return (
              <div key={b.id} className="glass animate-fade-up card-hover" style={{ borderRadius: '20px', padding: '22px', overflow: 'hidden', position: 'relative' }}>
                {/* Left accent bar */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: ss.dot, borderRadius: '3px 0 0 3px' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '15px', textTransform: 'capitalize' }}>
                        {b.listing_type} Booking
                      </span>
                      <span style={{ background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, borderRadius: '20px', padding: '2px 10px', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: ss.dot, display: 'inline-block' }} />
                        {b.status}
                      </span>
                    </div>
                    <p style={{ color: '#334155', fontSize: '11px', fontFamily: 'monospace' }}>#{b.booking_id}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#d4a0a0', fontSize: '18px', fontWeight: 800 }}>{formatPrice(b.grand_total || b.total_amount)}</div>
                    <div style={{ color: '#334155', fontSize: '11px', marginTop: '2px' }}>{formatDate(b.created_at)}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: b.special_instructions ? '12px' : '0' }}>
                  {tab === 'buyer' ? (
                    <span style={{ color: '#64748b', fontSize: '13px' }}>Owner: <span style={{ color: '#94a3b8', fontWeight: 500 }}>{b.owner_name}</span></span>
                  ) : (
                    <span style={{ color: '#64748b', fontSize: '13px' }}>From: <span style={{ color: '#94a3b8', fontWeight: 500 }}>{b.buyer_name}</span> · <a href={`tel:${b.buyer_phone}`} style={{ color: '#d4a0a0', textDecoration: 'none' }}>📞 {b.buyer_phone}</a></span>
                  )}
                  {b.start_date && (
                    <span style={{ color: '#64748b', fontSize: '13px' }}>
                      📅 <span style={{ color: '#94a3b8' }}>{formatDate(b.start_date)}</span>
                      {b.end_date && <> → <span style={{ color: '#94a3b8' }}>{formatDate(b.end_date)}</span></>}
                    </span>
                  )}
                </div>

                {b.special_instructions && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '10px 14px', marginTop: '12px' }}>
                    <p style={{ color: '#475569', fontSize: '12px', fontStyle: 'italic' }}>"{b.special_instructions}"</p>
                  </div>
                )}

                {/* Actions */}
                {tab === 'owner' && b.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button onClick={() => handleStatus(b.booking_id, 'approved')} disabled={!!actionLoading} className="btn-primary"
                      style={{ flex: 1, padding: '10px' }}>
                      {actionLoading === b.booking_id + 'approved' ? '⏳' : '✅ Approve'}
                    </button>
                    <button onClick={() => handleStatus(b.booking_id, 'rejected')} disabled={!!actionLoading} className="btn-danger"
                      style={{ flex: 1, padding: '10px', borderRadius: '12px' }}>
                      {actionLoading === b.booking_id + 'rejected' ? '⏳' : '❌ Reject'}
                    </button>
                  </div>
                )}
                {tab === 'owner' && b.status === 'approved' && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button onClick={() => handleStatus(b.booking_id, 'completed')} disabled={!!actionLoading}
                      style={{ width: '100%', padding: '10px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', transition: 'all 0.2s' }}>
                      {actionLoading === b.booking_id + 'completed' ? '⏳' : '✔ Mark as Completed'}
                    </button>
                  </div>
                )}
                {tab === 'buyer' && b.status === 'pending' && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button onClick={() => handleStatus(b.booking_id, 'cancelled')} disabled={!!actionLoading} className="btn-danger"
                      style={{ padding: '8px 20px', borderRadius: '10px' }}>
                      Cancel Request
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


