// src/pages/dashboards/FarmerDashboard.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getMyBookings } from '../../lib/bookings'
import { getMyListings, deleteListing } from '../../lib/listings'
import { getNotifications, markAllRead } from '../../lib/notifications'
import { formatPrice, formatDate, timeAgo } from '../../lib/utils'

const SS = {
  pending:   { bg: 'rgba(245,158,11,0.1)',  color: '#fbbf24', border: 'rgba(245,158,11,0.2)' },
  approved:  { bg: 'rgba(59,130,246,0.1)',  color: '#60a5fa', border: 'rgba(59,130,246,0.2)' },
  completed: { bg: 'rgba(139,92,246,0.1)',  color: '#a78bfa', border: 'rgba(139,92,246,0.2)' },
  cancelled: { bg: 'rgba(239,68,68,0.1)',   color: '#f87171', border: 'rgba(239,68,68,0.2)' },
  rejected:  { bg: 'rgba(239,68,68,0.1)',   color: '#f87171', border: 'rgba(239,68,68,0.2)' },
}

const QUICK_ACTIONS = [
  { to: '/listings?type=equipment', icon: '🚜', label: 'Rent Equipment', color: '#60a5fa', glow: 'rgba(96,165,250,0.1)' },
  { to: '/listings?type=land',      icon: '🌾', label: 'Lease Land',     color: '#86efac', glow: 'rgba(134,239,172,0.1)' },
  { to: '/listings?type=labor',     icon: '👨🌾', label: 'Hire Labor',   color: '#fbbf24', glow: 'rgba(251,191,36,0.1)' },
  { to: '/listings?type=livestock', icon: '🐄', label: 'Buy Livestock',  color: '#f97316', glow: 'rgba(249,115,22,0.1)' },
  { to: '/crop-sales',              icon: '🌽', label: 'Sell Crops',     color: '#4ade80', glow: 'rgba(74,222,128,0.1)' },
]

export default function FarmerDashboard() {
  const { user, profile } = useAuth()
  const [bookings, setBookings] = useState([])
  const [listings, setListings] = useState([])
  const [notifications, setNotifications] = useState([])
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getMyBookings().catch(() => []),
      getMyListings().catch(() => []),
      getNotifications().catch(() => []),
    ]).then(([b, l, n]) => { setBookings(b); setListings(l); setNotifications(n) })
      .finally(() => setLoading(false))
  }, [])

  const myBookings = bookings.filter((b) => b.buyer_id === user?.id)
  const receivedRequests = bookings.filter((b) => b.owner_id === user?.id)
  const unread = notifications.filter((n) => !n.is_read).length

  const TABS = [
    { id: 'overview',      label: 'Overview',     icon: '📊' },
    { id: 'my_listings',   label: 'My Listings',  icon: '📋', count: listings.length },
    { id: 'crop_sales',    label: 'Crop Sales',   icon: '🌽' },
    { id: 'bookings',      label: 'My Bookings',  icon: '🛒', count: myBookings.length },
    { id: 'requests',      label: 'Requests',     icon: '📥', count: receivedRequests.filter(b => b.status === 'pending').length, highlight: receivedRequests.filter(b => b.status === 'pending').length > 0 },
    { id: 'notifications', label: 'Alerts',       icon: '🔔', count: unread, highlight: unread > 0 },
  ]

  if (loading) return <Loader />

  return (
    <DashboardShell
      title={`Welcome, ${(profile?.name || user?.user_metadata?.name || 'Farmer').split(' ')[0]} 🌾`}
      subtitle="Farmer Dashboard"
      action={<Link to="/create-listing" className="btn-primary" style={{ textDecoration: 'none', padding: '10px 20px', fontSize: '13px' }}>+ List Equipment / Land</Link>}
      tabs={TABS}
      tab={tab}
      setTab={setTab}
    >
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '14px' }}>
            {[
              { label: 'My Listings',     value: listings.length,                                                                 icon: '📋', color: '#86efac' },
              { label: 'Active Bookings', value: myBookings.filter(b => b.status === 'approved').length,                         icon: '✅', color: '#60a5fa' },
              { label: 'Pending Requests', value: receivedRequests.filter(b => b.status === 'pending').length,                   icon: '⏳', color: '#fbbf24' },
              { label: 'Unread Alerts',   value: unread,                                                                         icon: '🔔', color: '#f97316' },
            ].map((s) => <StatCard key={s.label} {...s} />)}
          </div>

          {/* Quick Actions */}
          <div className="glass" style={{ borderRadius: '20px', padding: '24px' }}>
            <SectionTitle>Quick Actions</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '12px' }}>
              {QUICK_ACTIONS.map((a) => (
                <Link key={a.to} to={a.to} style={{ textDecoration: 'none', padding: '18px 14px', borderRadius: '14px', background: a.glow, border: `1px solid ${a.color}20`, textAlign: 'center', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 24px rgba(0,0,0,0.3)` }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>{a.icon}</div>
                  <div style={{ color: a.color, fontWeight: 600, fontSize: '13px' }}>{a.label}</div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent bookings */}
          <RecentBookings bookings={myBookings.slice(0, 5)} onViewAll={() => setTab('bookings')} />
        </div>
      )}

      {tab === 'bookings' && <BookingsList bookings={myBookings} emptyMsg="No bookings yet" emptyLink="/listings" emptyAction="Browse Listings →" />}
      {tab === 'crop_sales' && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🌽</div>
          <h3 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Bulk Crop Sales</h3>
          <p style={{ color: '#475569', fontSize: '14px', marginBottom: '24px' }}>Post your harvest for bulk sale and manage buyer requests</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/post-crop" className="btn-primary" style={{ textDecoration: 'none', padding: '11px 24px', background: 'linear-gradient(135deg,#86efac,#4ade80)', color: '#0f172a' }}>+ Post Crop</Link>
            <Link to="/crop-sales" className="btn-ghost" style={{ textDecoration: 'none', padding: '11px 24px' }}>View My Posts →</Link>
          </div>
        </div>
      )}
      {tab === 'requests' && (
        <ReceivedRequests bookings={receivedRequests} setBookings={setBookings} />
      )}
      {tab === 'my_listings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
            <Link to="/create-listing" className="btn-primary" style={{ textDecoration: 'none', padding: '8px 18px', fontSize: '13px' }}>+ New Listing</Link>
          </div>
          {listings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '14px' }}>📋</div>
              <h3 style={{ color: '#f1f5f9', fontSize: '17px', fontWeight: 600, marginBottom: '8px' }}>No listings yet</h3>
              <p style={{ color: '#475569', fontSize: '13px', marginBottom: '16px' }}>List your spare equipment or land for rent</p>
              <Link to="/create-listing" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', padding: '10px 22px' }}>Create Listing →</Link>
            </div>
          ) : listings.map((l) => (
            <div key={l.listing_id} className="glass card-hover" style={{ borderRadius: '16px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                {l.images?.[0] ? <img src={l.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (l.type === 'equipment' ? '🚜' : '🌾')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link to={`/listings/${l.listing_id}`} style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>{l.title}</Link>
                <p style={{ color: '#475569', fontSize: '12px', marginTop: '2px', textTransform: 'capitalize' }}>{l.type} · 📍 {l.location} · 👁 {l.views || 0} · {timeAgo(l.created_at)}</p>
                <p style={{ color: '#d4a0a0', fontWeight: 700, fontSize: '13px', marginTop: '3px' }}>{formatPrice(l.price)}/{l.price_unit}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <Link to={`/listings/${l.listing_id}`} className="btn-ghost" style={{ textDecoration: 'none', padding: '6px 12px', fontSize: '12px' }}>View</Link>
                <button onClick={async () => { if (confirm('Delete this listing?')) { await deleteListing(l.listing_id); setListings(ls => ls.filter(x => x.listing_id !== l.listing_id)) } }} className="btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }}>Del</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {tab === 'notifications' && <NotificationsList notifications={notifications} setNotifications={setNotifications} />}
    </DashboardShell>
  )
}

// ── Shared sub-components ──

export function Loader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '44px', height: '44px', border: '3px solid rgba(167,116,116,0.2)', borderTopColor: '#d4a0a0', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
        <p style={{ color: '#475569', fontSize: '14px' }}>Loading...</p>
      </div>
    </div>
  )
}

export function SectionTitle({ children }) {
  return <h2 style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '16px' }}>{children}</h2>
}

export function StatCard({ label, value, icon, color, glow }) {
  return (
    <div className="glass card-hover animate-fade-up" style={{ borderRadius: '18px', padding: '20px', background: `radial-gradient(ellipse at top left, ${glow || 'rgba(167,116,116,0.08)'} 0%, transparent 60%), rgba(255,255,255,0.02)` }}>
      <div style={{ fontSize: '26px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ color: color || '#d4a0a0', fontSize: '24px', fontWeight: 800, lineHeight: 1 }}>{value}</div>
      <div style={{ color: '#475569', fontSize: '11px', marginTop: '6px', fontWeight: 500 }}>{label}</div>
    </div>
  )
}

export function DashboardShell({ title, subtitle, action, tabs, tab, setTab, children }) {
  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <p style={{ color: '#d4a0a0', fontSize: '11px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>{subtitle}</p>
          <h1 style={{ color: '#f1f5f9', fontSize: '1.75rem', fontWeight: 700 }}>{title}</h1>
        </div>
        {action}
      </div>

      <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', padding: '4px', marginBottom: '24px', overflowX: 'auto' }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, padding: '9px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap', background: tab === t.id ? 'rgba(255,255,255,0.08)' : 'transparent', color: tab === t.id ? '#f1f5f9' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
            {t.icon} {t.label}
            {t.count !== undefined && (
              <span style={{ background: t.highlight ? 'linear-gradient(135deg,#d4a0a0,#a77474)' : 'rgba(255,255,255,0.08)', color: t.highlight ? '#0f0a0a' : '#64748b', borderRadius: '8px', padding: '1px 6px', fontSize: '10px', fontWeight: 700 }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {children}
    </div>
  )
}

export function RecentBookings({ bookings, onViewAll }) {
  return (
    <div className="glass" style={{ borderRadius: '20px', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <SectionTitle>Recent Bookings</SectionTitle>
        <button onClick={onViewAll} style={{ background: 'none', border: 'none', color: '#d4a0a0', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>View all →</button>
      </div>
      {bookings.length === 0 ? (
        <p style={{ color: '#334155', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No bookings yet.</p>
      ) : bookings.map((b) => {
        const ss = SS[b.status] || SS.pending
        return (
          <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500, textTransform: 'capitalize' }}>{b.listing_type} Booking</span>
              <p style={{ color: '#334155', fontSize: '11px' }}>{b.owner_name} · {formatDate(b.created_at)}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#d4a0a0', fontWeight: 700, fontSize: '13px' }}>{formatPrice(b.grand_total || b.total_amount)}</span>
              <span style={{ background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, borderRadius: '20px', padding: '2px 9px', fontSize: '10px', fontWeight: 600 }}>{b.status}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function BookingsList({ bookings, emptyMsg, emptyLink, emptyAction }) {
  if (bookings.length === 0) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '48px', marginBottom: '14px' }}>📭</div>
      <h3 style={{ color: '#f1f5f9', fontSize: '17px', fontWeight: 600, marginBottom: '8px' }}>{emptyMsg}</h3>
      {emptyLink && <Link to={emptyLink} className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '14px', padding: '10px 22px' }}>{emptyAction}</Link>}
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {bookings.map((b) => {
        const ss = SS[b.status] || SS.pending
        return (
          <div key={b.id} className="glass animate-fade-up" style={{ borderRadius: '16px', padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', borderLeft: `3px solid ${ss.color}` }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '14px', textTransform: 'capitalize' }}>{b.listing_type} Booking</span>
                <span style={{ background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, borderRadius: '20px', padding: '2px 9px', fontSize: '10px', fontWeight: 600 }}>{b.status}</span>
              </div>
              <p style={{ color: '#475569', fontSize: '12px' }}>#{b.booking_id?.slice(-10)}</p>
              {b.start_date && <p style={{ color: '#334155', fontSize: '12px', marginTop: '4px' }}>📅 {formatDate(b.start_date)}{b.end_date ? ` → ${formatDate(b.end_date)}` : ''}</p>}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ color: '#d4a0a0', fontWeight: 700, fontSize: '16px' }}>{formatPrice(b.grand_total || b.total_amount)}</div>
              <div style={{ color: '#334155', fontSize: '11px', marginTop: '2px' }}>{timeAgo(b.created_at)}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ReceivedRequests({ bookings, setBookings }) {
  async function handleStatus(bookingId, status) {
    const { updateBookingStatus } = await import('../../lib/bookings')
    await updateBookingStatus(bookingId, status)
    setBookings((bs) => bs.map((b) => b.booking_id === bookingId ? { ...b, status } : b))
  }
  const pending = bookings.filter(b => b.status === 'pending')
  if (bookings.length === 0) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '48px', marginBottom: '14px' }}>📥</div>
      <h3 style={{ color: '#f1f5f9', fontSize: '17px', fontWeight: 600 }}>No requests yet</h3>
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {bookings.map((b) => {
        const ss = SS[b.status] || SS.pending
        return (
          <div key={b.booking_id} className="glass" style={{ borderRadius: '16px', padding: '18px', borderLeft: `3px solid ${ss.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: b.status === 'pending' ? '12px' : '0' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <p style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '14px' }}>{b.buyer_name}</p>
                  <span style={{ background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, borderRadius: '20px', padding: '2px 9px', fontSize: '10px', fontWeight: 600 }}>{b.status}</span>
                </div>
                <p style={{ color: '#475569', fontSize: '12px' }}>📞 {b.buyer_phone}</p>
                {b.start_date && <p style={{ color: '#334155', fontSize: '12px' }}>📅 {formatDate(b.start_date)}{b.end_date ? ` → ${formatDate(b.end_date)}` : ''}</p>}
              </div>
              <span style={{ color: '#d4a0a0', fontWeight: 700, fontSize: '16px' }}>{formatPrice(b.grand_total || b.total_amount)}</span>
            </div>
            {b.status === 'pending' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleStatus(b.booking_id, 'approved')} className="btn-primary" style={{ flex: 1, padding: '8px' }}>✅ Approve</button>
                <button onClick={() => handleStatus(b.booking_id, 'rejected')} className="btn-danger" style={{ flex: 1, padding: '8px', borderRadius: '10px' }}>❌ Reject</button>
              </div>
            )}
            {b.status === 'approved' && (
              <button onClick={() => handleStatus(b.booking_id, 'completed')} style={{ width: '100%', padding: '8px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                ✔ Mark Completed
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function NotificationsList({ notifications, setNotifications }) {
  const unread = notifications.filter((n) => !n.is_read).length
  async function handleMarkAll() {
    await markAllRead()
    setNotifications((ns) => ns.map((n) => ({ ...n, is_read: true })))
  }
  return (
    <div>
      {unread > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
          <button onClick={handleMarkAll} style={{ background: 'none', border: 'none', color: '#d4a0a0', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>✓ Mark all as read</button>
        </div>
      )}
      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '14px' }}>🔔</div>
          <h3 style={{ color: '#f1f5f9', fontSize: '17px', fontWeight: 600 }}>No notifications</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notifications.map((n, i) => (
            <div key={n.id} className="animate-fade-up" style={{ borderRadius: '14px', padding: '14px 16px', background: n.is_read ? 'rgba(255,255,255,0.02)' : 'rgba(167,116,116,0.04)', border: `1px solid ${n.is_read ? 'rgba(255,255,255,0.06)' : 'rgba(167,116,116,0.15)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', animationDelay: `${i * 0.04}s`, animationFillMode: 'both' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                {!n.is_read && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d4a0a0', flexShrink: 0, marginTop: '5px' }} />}
                <div>
                  <p style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '13px', marginBottom: '3px' }}>{n.title}</p>
                  <p style={{ color: '#64748b', fontSize: '12px' }}>{n.message}</p>
                </div>
              </div>
              <span style={{ color: '#334155', fontSize: '11px', whiteSpace: 'nowrap', flexShrink: 0 }}>{timeAgo(n.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
