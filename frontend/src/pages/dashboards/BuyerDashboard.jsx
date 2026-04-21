// src/pages/dashboards/BuyerDashboard.jsx
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getNotifications } from '../../lib/notifications'
import { getListings } from '../../lib/listings'
import { getCropPosts, expressInterest, getMyInterests } from '../../lib/cropSales'
import { getMyBookings } from '../../lib/bookings'
import { supabase } from '../../lib/supabase'
import { formatPrice, timeAgo } from '../../lib/utils'
import { Loader, DashboardShell, StatCard, SectionTitle, NotificationsList } from './FarmerDashboard'

const MARKET_CATS = [
  { id: 'seed',         label: 'Seeds',       icon: '🌱', color: '#86efac' },
  { id: 'fertilizer',   label: 'Fertilizers', icon: '🪣', color: '#fbbf24' },
  { id: 'pesticide',    label: 'Pesticides',  icon: '🧪', color: '#f87171' },
  { id: 'vet_medicine', label: 'Vet Medicine',icon: '💊', color: '#60a5fa' },
  { id: 'tool',         label: 'Farm Tools',  icon: '🔧', color: '#a78bfa' },
  { id: 'feed',         label: 'Animal Feed', icon: '🌾', color: '#f97316' },
]

const BROWSE_TYPES = [
  { value: 'all',       label: 'All',       icon: '🔍', color: '#94a3b8' },
  { value: 'equipment', label: 'Equipment', icon: '🚜', color: '#f97316' },
  { value: 'land',      label: 'Land',      icon: '🌾', color: '#4ade80' },
  { value: 'labor',     label: 'Labor',     icon: '👨‍🌾', color: '#60a5fa' },
  { value: 'livestock', label: 'Livestock', icon: '🐄', color: '#f472b6' },
  { value: 'crops',     label: 'Crops',     icon: '🌽', color: '#86efac' },
]

// ── Small listing card for browse tab ──
function BrowseCard({ item, type, onInterest, sentIds }) {
  const navigate = useNavigate()
  const isCrop = type === 'crops'

  const image = item.images?.[0]
  const icon = type === 'equipment' ? '🚜' : type === 'land' ? '🌾' : type === 'labor' ? '👨‍🌾' : type === 'livestock' ? '🐄' : '🌽'
  const title = item.title
  const location = item.location
  const price = isCrop
    ? `${formatPrice(item.price_per_unit)}/${item.unit}`
    : item.rent_or_sell === 'sell'
      ? formatPrice(item.price)
      : `${formatPrice(item.price)}/${item.price_unit || 'unit'}`
  const meta = isCrop
    ? `🌱 ${item.crop_type} · 📦 ${item.quantity} ${item.unit} · 👨‍🌾 ${item.farmer_name}`
    : `${item.type?.toUpperCase()} · 👤 ${item.owner_name}`
  const isSold = item.status === 'sold'
  const alreadySent = sentIds?.has(item.id)

  return (
    <div className="glass card-hover animate-fade-up" style={{ borderRadius: '16px', overflow: 'hidden', opacity: isSold ? 0.65 : 1 }}>
      <div style={{ height: '140px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {image
          ? <img src={image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: '44px' }}>{icon}</span>
        }
        {isSold && (
          <span style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(239,68,68,0.85)', color: 'white', borderRadius: '20px', padding: '2px 10px', fontSize: '10px', fontWeight: 700 }}>SOLD</span>
        )}
      </div>
      <div style={{ padding: '14px' }}>
        <p style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '13px', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
        <p style={{ color: '#475569', fontSize: '11px', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta}</p>
        <p style={{ color: '#64748b', fontSize: '11px', marginBottom: '10px' }}>📍 {location}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#d4a0a0', fontWeight: 700, fontSize: '13px' }}>{price}</span>
          {isCrop
            ? !isSold && (
              <button
                onClick={() => onInterest(item)}
                disabled={alreadySent}
                style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: alreadySent ? 'default' : 'pointer', border: 'none', background: alreadySent ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#86efac,#4ade80)', color: alreadySent ? '#475569' : '#0f172a' }}
              >
                {alreadySent ? '✓ Sent' : '🤝 Interested'}
              </button>
            )
            : (
              <button
                onClick={() => navigate(`/listings/${item.listing_id}`)}
                style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}
              >
                View →
              </button>
            )
          }
        </div>
      </div>
    </div>
  )
}

// ── Interest modal (inline, lightweight) ──
function InterestModal({ post, onClose, onDone }) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await expressInterest(post.id, message)
      onDone(post.id)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass" style={{ borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '420px' }}>
        <h3 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '17px', marginBottom: '6px' }}>Express Interest</h3>
        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>{post.title} · {post.quantity} {post.unit} · {formatPrice(post.price_per_unit)}/{post.unit}</p>
        {error && <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '12px' }}>⚠️ {error}</p>}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} className="input-dark" style={{ resize: 'vertical' }} placeholder="Message to farmer (optional)..." />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 2, padding: '11px', borderRadius: '12px' }}>
              {loading ? '⏳ Sending...' : '🤝 Send Interest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function BuyerDashboard() {
  const { user, profile } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState([])

  // browse state
  const [browseType, setBrowseType] = useState('all')
  const [listings, setListings] = useState([])
  const [cropPosts, setCropPosts] = useState([])
  const [sentIds, setSentIds] = useState(new Set())
  const [browseLoading, setBrowseLoading] = useState(false)
  const [interestPost, setInterestPost] = useState(null)

  useEffect(() => {
    Promise.all([
      getNotifications().catch(() => []),
      getMyBookings().catch(() => []),
    ]).then(([n, b]) => { setNotifications(n); setBookings(b) }).finally(() => setLoading(false))
  }, [])

  // Realtime: update booking status live when owner approves/rejects
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`buyer_bookings_${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `buyer_id=eq.${user.id}` },
        (payload) => setBookings(prev => prev.map(b => b.booking_id === payload.new.booking_id ? payload.new : b))
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user])

  // fetch browse data when tab or type changes
  useEffect(() => {
    if (tab !== 'browse') return
    setBrowseLoading(true)
    const isCrops = browseType === 'crops'
    const isAll = browseType === 'all'

    Promise.all([
      // listings: fetch if not crops-only
      (!isCrops) ? getListings(isAll ? {} : { type: browseType }).catch(() => []) : Promise.resolve([]),
      // crops: fetch if crops or all
      (isCrops || isAll) ? getCropPosts().catch(() => []) : Promise.resolve([]),
      // my interests to mark already-sent
      getMyInterests().catch(() => []),
    ]).then(([lst, crops, myInterests]) => {
      setListings(lst)
      setCropPosts(crops)
      setSentIds(new Set(myInterests.map(i => i.crop_post_id)))
    }).finally(() => setBrowseLoading(false))
  }, [tab, browseType])

  const myRequests = bookings.filter(b => b.buyer_id === user?.id)
  const unread = notifications.filter(n => !n.is_read).length

  const TABS = [
    { id: 'overview',      label: 'Overview',    icon: '📊' },
    { id: 'browse',        label: 'Browse',      icon: '🔍' },
    { id: 'my_requests',   label: 'My Requests', icon: '🛒', count: myRequests.length },
    { id: 'crop_feed',     label: 'Crop Feed',   icon: '🌽' },
    { id: 'shop',          label: 'Shop',        icon: '🛍️' },
    { id: 'notifications', label: 'Alerts',      icon: '🔔', count: unread, highlight: unread > 0 },
  ]

  // combine listings + crops for "all" view
  const browseItems = browseType === 'all'
    ? [
        ...listings.map(l => ({ ...l, _kind: l.type })),
        ...cropPosts.map(c => ({ ...c, _kind: 'crops' })),
      ]
    : browseType === 'crops'
      ? cropPosts.map(c => ({ ...c, _kind: 'crops' }))
      : listings.map(l => ({ ...l, _kind: l.type }))

  if (loading) return <Loader />

  return (
    <DashboardShell
      title={`Welcome, ${(profile?.name || user?.user_metadata?.name || 'Buyer').split(' ')[0]} 🛍️`}
      subtitle="Buyer Dashboard"
      action={
        <Link to="/marketplace" className="btn-primary" style={{ textDecoration: 'none', padding: '10px 20px', fontSize: '13px' }}>
          🛒 Shop Now
        </Link>
      }
      tabs={TABS} tab={tab} setTab={setTab}
    >
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '14px' }}>
            <StatCard label="Unread Alerts" value={unread} icon="🔔" color="#fbbf24" />
            <StatCard label="Categories" value={MARKET_CATS.length} icon="📦" color="#34d399" />
          </div>

          {/* Quick browse shortcuts */}
          <div className="glass" style={{ borderRadius: '20px', padding: '24px' }}>
            <SectionTitle>Browse by Type</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: '10px' }}>
              {BROWSE_TYPES.filter(t => t.value !== 'all').map(c => (
                <button key={c.value} onClick={() => { setTab('browse'); setBrowseType(c.value) }}
                  style={{ padding: '18px 10px', borderRadius: '14px', background: `${c.color}10`, border: `1px solid ${c.color}20`, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.3)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                  <div style={{ fontSize: '26px', marginBottom: '6px' }}>{c.icon}</div>
                  <div style={{ color: c.color, fontWeight: 600, fontSize: '12px' }}>{c.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick shop */}
          <div className="glass" style={{ borderRadius: '20px', padding: '24px' }}>
            <SectionTitle>Shop by Category</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: '12px' }}>
              {MARKET_CATS.map(c => (
                <Link key={c.id} to={`/marketplace?category=${c.id}`} style={{ textDecoration: 'none', padding: '16px 12px', borderRadius: '14px', background: `${c.color}10`, border: `1px solid ${c.color}20`, textAlign: 'center', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.3)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                  <div style={{ fontSize: '26px', marginBottom: '6px' }}>{c.icon}</div>
                  <div style={{ color: c.color, fontWeight: 600, fontSize: '12px' }}>{c.label}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'browse' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Type filter pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {BROWSE_TYPES.map(t => (
              <button key={t.value} onClick={() => setBrowseType(t.value)}
                style={{ padding: '7px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: `1px solid ${browseType === t.value ? `${t.color}50` : 'rgba(255,255,255,0.08)'}`, background: browseType === t.value ? `${t.color}15` : 'rgba(255,255,255,0.04)', color: browseType === t.value ? t.color : '#64748b', transition: 'all 0.2s' }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {browseLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '14px' }}>
              {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: '260px', borderRadius: '16px' }} />)}
            </div>
          ) : browseItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '14px' }}>🔍</div>
              <h3 style={{ color: '#f1f5f9', fontSize: '17px', fontWeight: 600 }}>No listings found</h3>
              <p style={{ color: '#475569', fontSize: '13px', marginTop: '6px' }}>Check back later or try a different category</p>
            </div>
          ) : (
            <>
              <p style={{ color: '#334155', fontSize: '12px' }}>{browseItems.length} item{browseItems.length !== 1 ? 's' : ''} found</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '14px' }}>
                {browseItems.map(item => (
                  <BrowseCard
                    key={item._kind === 'crops' ? `crop_${item.id}` : item.listing_id}
                    item={item}
                    type={item._kind}
                    sentIds={sentIds}
                    onInterest={p => setInterestPost(p)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'my_requests' && (
        <MyRequestsList bookings={myRequests} />
      )}

      {tab === 'crop_feed' && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🌽</div>
          <h3 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Buy Crops in Bulk</h3>
          <p style={{ color: '#475569', fontSize: '14px', marginBottom: '24px' }}>Browse fresh crop listings directly from farmers and express your interest</p>
          <Link to="/crop-sales" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', padding: '12px 28px', background: 'linear-gradient(135deg,#86efac,#4ade80)', color: '#0f172a' }}>
            Browse Crop Feed →
          </Link>
        </div>
      )}

      {tab === 'shop' && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🛍️</div>
          <h3 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Agri Products Marketplace</h3>
          <p style={{ color: '#475569', fontSize: '14px', marginBottom: '24px' }}>Browse seeds, fertilizers, pesticides, vet medicine & farm tools</p>
          <Link to="/marketplace" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', padding: '12px 28px' }}>
            Open Marketplace →
          </Link>
        </div>
      )}

      {tab === 'notifications' && <NotificationsList notifications={notifications} setNotifications={setNotifications} />}

      {interestPost && (
        <InterestModal
          post={interestPost}
          onClose={() => setInterestPost(null)}
          onDone={(id) => { setSentIds(prev => new Set([...prev, id])); setInterestPost(null) }}
        />
      )}
    </DashboardShell>
  )
}

const STATUS_STYLE = {
  pending:   { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)' },
  approved:  { color: '#60a5fa', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.2)' },
  completed: { color: '#a78bfa', bg: 'rgba(139,92,246,0.1)',  border: 'rgba(139,92,246,0.2)' },
  cancelled: { color: '#f87171', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)' },
  rejected:  { color: '#f87171', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)' },
}

function MyRequestsList({ bookings }) {
  if (bookings.length === 0) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '48px', marginBottom: '14px' }}>🛒</div>
      <h3 style={{ color: '#f1f5f9', fontSize: '17px', fontWeight: 600, marginBottom: '8px' }}>No requests sent yet</h3>
      <p style={{ color: '#475569', fontSize: '13px' }}>Browse listings and send a booking request to an owner</p>
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {bookings.map(b => {
        const ss = STATUS_STYLE[b.status] || STATUS_STYLE.pending
        return (
          <div key={b.booking_id} className="glass animate-fade-up" style={{ borderRadius: '16px', padding: '18px', borderLeft: `3px solid ${ss.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '14px', textTransform: 'capitalize' }}>
                    {b.listing_type} Booking
                  </span>
                  <span style={{ background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, borderRadius: '20px', padding: '2px 9px', fontSize: '10px', fontWeight: 600 }}>
                    {b.status}
                  </span>
                </div>
                <p style={{ color: '#475569', fontSize: '12px' }}>To: {b.owner_name}</p>
                {b.start_date && (
                  <p style={{ color: '#334155', fontSize: '12px', marginTop: '3px' }}>
                    📅 {b.start_date}{b.end_date ? ` → ${b.end_date}` : ''}
                  </p>
                )}
                {b.special_instructions && (
                  <p style={{ color: '#475569', fontSize: '12px', fontStyle: 'italic', marginTop: '4px' }}>"{b.special_instructions}"</p>
                )}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ color: '#d4a0a0', fontWeight: 700, fontSize: '15px' }}>
                  ₹{(b.grand_total || b.total_amount || 0).toLocaleString('en-IN')}
                </div>
                <div style={{ color: '#334155', fontSize: '11px', marginTop: '2px' }}>{timeAgo(b.created_at)}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
