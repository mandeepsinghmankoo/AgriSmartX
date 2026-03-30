// src/pages/dashboards/EquipmentOwnerDashboard.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getMyListings, deleteListing } from '../../lib/listings'
import { getMyBookings, updateBookingStatus } from '../../lib/bookings'
import { getNotifications } from '../../lib/notifications'
import { formatPrice, formatDate, timeAgo } from '../../lib/utils'
import { Loader, DashboardShell, StatCard, SectionTitle, NotificationsList } from './FarmerDashboard'

const SS = {
  pending:   { bg: 'rgba(245,158,11,0.1)',  color: '#fbbf24', border: 'rgba(245,158,11,0.2)' },
  approved:  { bg: 'rgba(59,130,246,0.1)',  color: '#60a5fa', border: 'rgba(59,130,246,0.2)' },
  completed: { bg: 'rgba(139,92,246,0.1)',  color: '#a78bfa', border: 'rgba(139,92,246,0.2)' },
  cancelled: { bg: 'rgba(239,68,68,0.1)',   color: '#f87171', border: 'rgba(239,68,68,0.2)' },
  rejected:  { bg: 'rgba(239,68,68,0.1)',   color: '#f87171', border: 'rgba(239,68,68,0.2)' },
}

const TYPE_ICON = { equipment: '🚜', livestock: '🐄' }

export default function EquipmentOwnerDashboard() {
  const { user, profile } = useAuth()
  const [listings, setListings] = useState([])
  const [bookings, setBookings] = useState([])
  const [notifications, setNotifications] = useState([])
  const [tab, setTab] = useState('overview')
  const [listingFilter, setListingFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getMyListings().catch(() => []),
      getMyBookings().catch(() => []),
      getNotifications().catch(() => []),
    ]).then(([l, b, n]) => { setListings(l); setBookings(b); setNotifications(n) })
      .finally(() => setLoading(false))
  }, [])

  const myEquipment  = listings.filter((l) => l.type === 'equipment')
  const myLivestock  = listings.filter((l) => l.type === 'livestock')
  const allListings  = listings.filter((l) => ['equipment', 'livestock'].includes(l.type))
  const requests     = bookings.filter((b) => b.owner_id === user?.id)
  const pending      = requests.filter((b) => b.status === 'pending')
  const totalEarnings = requests.filter(b => b.status === 'completed').reduce((s, b) => s + (b.grand_total || 0), 0)
  const unread       = notifications.filter((n) => !n.is_read).length

  const filteredListings = listingFilter === 'all' ? allListings
    : listingFilter === 'equipment' ? myEquipment : myLivestock

  async function handleStatus(bookingId, status) {
    await updateBookingStatus(bookingId, status)
    setBookings((bs) => bs.map((b) => b.booking_id === bookingId ? { ...b, status } : b))
  }

  const TABS = [
    { id: 'overview',      label: 'Overview',    icon: '📊' },
    { id: 'listings',      label: 'My Listings', icon: '📦', count: allListings.length },
    { id: 'requests',      label: 'Requests',    icon: '📥', count: pending.length, highlight: pending.length > 0 },
    { id: 'earnings',      label: 'Earnings',    icon: '💰' },
    { id: 'notifications', label: 'Alerts',      icon: '🔔', count: unread, highlight: unread > 0 },
  ]

  if (loading) return <Loader />

  return (
    <DashboardShell
      title={`${(profile?.name || user?.user_metadata?.name || 'Owner').split(' ')[0]}'s Assets 🚜`}
      subtitle="Asset Owner Dashboard"
      action={<Link to="/create-listing" className="btn-primary" style={{ textDecoration: 'none', padding: '10px 20px', fontSize: '13px' }}>+ Add Listing</Link>}
      tabs={TABS} tab={tab} setTab={setTab}
    >
      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '14px' }}>
            <StatCard label="Equipment"       value={myEquipment.length}  icon="🚜" color="#60a5fa" />
            <StatCard label="Livestock"        value={myLivestock.length}  icon="🐄" color="#f97316" />
            <StatCard label="Pending Requests" value={pending.length}      icon="📥" color="#fbbf24" />
            <StatCard label="Total Earnings"   value={`₹${totalEarnings.toLocaleString('en-IN')}`} icon="💰" color="#86efac" />
          </div>

          {/* Pending requests preview */}
          {pending.length > 0 && (
            <div className="glass" style={{ borderRadius: '20px', padding: '24px' }}>
              <SectionTitle>Pending Requests</SectionTitle>
              {pending.map((b) => (
                <div key={b.booking_id} style={{ padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <p style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '14px' }}>{b.buyer_name}</p>
                      <p style={{ color: '#475569', fontSize: '12px' }}>📞 {b.buyer_phone}</p>
                      {b.start_date && <p style={{ color: '#334155', fontSize: '12px' }}>📅 {formatDate(b.start_date)} → {formatDate(b.end_date)}</p>}
                    </div>
                    <span style={{ color: '#d4a0a0', fontWeight: 700, fontSize: '16px' }}>{formatPrice(b.grand_total || b.total_amount)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleStatus(b.booking_id, 'approved')} className="btn-primary" style={{ flex: 1, padding: '8px' }}>✅ Approve</button>
                    <button onClick={() => handleStatus(b.booking_id, 'rejected')} className="btn-danger" style={{ flex: 1, padding: '8px', borderRadius: '10px' }}>❌ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Listings preview */}
          <div className="glass" style={{ borderRadius: '20px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <SectionTitle>Recent Listings</SectionTitle>
              <button onClick={() => setTab('listings')} style={{ background: 'none', border: 'none', color: '#d4a0a0', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>View all →</button>
            </div>
            {allListings.slice(0, 4).map((l) => (
              <div key={l.listing_id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                  {l.images?.[0] ? <img src={l.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : TYPE_ICON[l.type]}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '13px' }}>{l.title}</p>
                  <p style={{ color: '#475569', fontSize: '11px', textTransform: 'capitalize' }}>{l.type} · 👁 {l.views || 0} · {timeAgo(l.created_at)}</p>
                </div>
                <span style={{ color: '#d4a0a0', fontWeight: 700, fontSize: '13px' }}>{formatPrice(l.price)}</span>
              </div>
            ))}
            {allListings.length === 0 && <p style={{ color: '#334155', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No listings yet.</p>}
          </div>
        </div>
      )}

      {/* ── MY LISTINGS ── */}
      {tab === 'listings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
            {[['all', 'All', `${allListings.length}`], ['equipment', '🚜 Equipment', `${myEquipment.length}`], ['livestock', '🐄 Livestock', `${myLivestock.length}`]].map(([val, label, count]) => (
              <button key={val} onClick={() => setListingFilter(val)}
                style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: listingFilter === val ? 'linear-gradient(135deg,#d4a0a0,#a77474)' : 'rgba(255,255,255,0.06)', color: listingFilter === val ? '#0f0a0a' : '#64748b' }}>
                {label} ({count})
              </button>
            ))}
            <Link to="/create-listing" className="btn-primary" style={{ textDecoration: 'none', padding: '6px 14px', fontSize: '12px', marginLeft: 'auto' }}>+ Add</Link>
          </div>

          {filteredListings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '14px' }}>📦</div>
              <h3 style={{ color: '#f1f5f9', fontSize: '17px', fontWeight: 600, marginBottom: '8px' }}>No listings yet</h3>
              <Link to="/create-listing" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '14px', padding: '10px 22px' }}>Add Listing →</Link>
            </div>
          ) : filteredListings.map((l) => (
            <div key={l.listing_id} className="glass card-hover" style={{ borderRadius: '16px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                {l.images?.[0] ? <img src={l.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : TYPE_ICON[l.type]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link to={`/listings/${l.listing_id}`} style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>{l.title}</Link>
                <p style={{ color: '#475569', fontSize: '12px', marginTop: '2px', textTransform: 'capitalize' }}>{l.type} · 📍 {l.location} · 👁 {l.views || 0} · {timeAgo(l.created_at)}</p>
                <p style={{ color: '#d4a0a0', fontWeight: 700, fontSize: '13px', marginTop: '3px' }}>{formatPrice(l.price)}/{l.price_unit}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <Link to={`/listings/${l.listing_id}`} className="btn-ghost" style={{ textDecoration: 'none', padding: '6px 12px', fontSize: '12px' }}>View</Link>
                <button onClick={async () => { if (confirm('Delete?')) { await deleteListing(l.listing_id); setListings(ls => ls.filter(x => x.listing_id !== l.listing_id)) } }} className="btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }}>Del</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── REQUESTS ── */}
      {tab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '14px' }}>📥</div>
              <h3 style={{ color: '#f1f5f9', fontSize: '17px', fontWeight: 600 }}>No requests yet</h3>
            </div>
          ) : requests.map((b) => {
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
                    {b.start_date && <p style={{ color: '#334155', fontSize: '12px' }}>📅 {formatDate(b.start_date)} → {formatDate(b.end_date)}</p>}
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
      )}

      {/* ── EARNINGS ── */}
      {tab === 'earnings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '14px' }}>
            <StatCard label="Total Earned"   value={`₹${totalEarnings.toLocaleString('en-IN')}`} icon="💰" color="#86efac" />
            <StatCard label="Completed Jobs" value={requests.filter(b => b.status === 'completed').length} icon="✅" color="#60a5fa" />
            <StatCard label="Avg per Job"    value={requests.filter(b => b.status === 'completed').length ? formatPrice(totalEarnings / requests.filter(b => b.status === 'completed').length) : '—'} icon="📊" color="#fbbf24" />
          </div>
          <div className="glass" style={{ borderRadius: '20px', padding: '24px' }}>
            <SectionTitle>Completed Transactions</SectionTitle>
            {requests.filter(b => b.status === 'completed').length === 0 ? (
              <p style={{ color: '#334155', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No completed transactions yet.</p>
            ) : requests.filter(b => b.status === 'completed').map((b) => (
              <div key={b.booking_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>{b.buyer_name}</p>
                  <p style={{ color: '#334155', fontSize: '11px', textTransform: 'capitalize' }}>{b.listing_type} · {formatDate(b.completed_at || b.created_at)}</p>
                </div>
                <span style={{ color: '#86efac', fontWeight: 700, fontSize: '14px' }}>+{formatPrice(b.grand_total || b.total_amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'notifications' && <NotificationsList notifications={notifications} setNotifications={setNotifications} />}
    </DashboardShell>
  )
}
