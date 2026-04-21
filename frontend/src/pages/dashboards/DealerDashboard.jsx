// src/pages/dashboards/DealerDashboard.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getMyListings, deleteListing } from '../../lib/listings'
import { getMyBookings, updateBookingStatus } from '../../lib/bookings'
import { getNotifications } from '../../lib/notifications'
import { supabase } from '../../lib/supabase'
import { formatPrice, timeAgo } from '../../lib/utils'
import { Loader, DashboardShell, StatCard, SectionTitle, NotificationsList } from './FarmerDashboard'

export default function DealerDashboard() {
  const { user, profile } = useAuth()
  const [listings, setListings] = useState([])
  const [bookings, setBookings] = useState([])
  const [notifications, setNotifications] = useState([])
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getMyListings().catch(() => []),
      getMyBookings().catch(() => []),
      getNotifications().catch(() => []),
    ]).then(([l, b, n]) => { setListings(l); setBookings(b); setNotifications(n) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`dealer_bookings_${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings', filter: `owner_id=eq.${user.id}` },
        (payload) => setBookings(prev => [payload.new, ...prev])
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `owner_id=eq.${user.id}` },
        (payload) => setBookings(prev => prev.map(b => b.booking_id === payload.new.booking_id ? payload.new : b))
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user])

  const myListings = listings
  const salesRequests = bookings.filter((b) => b.owner_id === user?.id)
  const myPurchases = bookings.filter((b) => b.buyer_id === user?.id)
  const pending = salesRequests.filter((b) => b.status === 'pending')
  const totalRevenue = salesRequests.filter(b => b.status === 'completed').reduce((s, b) => s + (b.grand_total || 0), 0)
  const unread = notifications.filter((n) => !n.is_read).length

  async function handleStatus(bookingId, status) {
    await updateBookingStatus(bookingId, status)
    setBookings((bs) => bs.map((b) => b.booking_id === bookingId ? { ...b, status } : b))
  }

  const TABS = [
    { id: 'overview',      label: 'Overview',    icon: '📊' },
    { id: 'inventory',     label: 'Inventory',   icon: '📦', count: myListings.length },
    { id: 'sales',         label: 'Sales',       icon: '💼', count: pending.length, highlight: pending.length > 0 },
    { id: 'purchases',     label: 'Purchases',   icon: '🛒', count: myPurchases.length },
    { id: 'notifications', label: 'Alerts',      icon: '🔔', count: unread, highlight: unread > 0 },
  ]

  if (loading) return <Loader />

  return (
    <DashboardShell
      title={`${(profile?.name || user?.user_metadata?.name || 'Seller').split(' ')[0]}'s Store 🏪`}
      subtitle="Seller Dashboard"
      action={<Link to="/create-listing" className="btn-primary" style={{ textDecoration: 'none', padding: '10px 20px', fontSize: '13px' }}>+ Add Listing</Link>}
      tabs={TABS} tab={tab} setTab={setTab}
    >
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '14px' }}>
            <StatCard label="Listed Items" value={myListings.length} icon="📦" color="#a78bfa" />
            <StatCard label="Pending Sales" value={pending.length} icon="💼" color="#fbbf24" />
            <StatCard label="Total Revenue" value={`₹${totalRevenue.toLocaleString('en-IN')}`} icon="💰" color="#86efac" />
            <StatCard label="My Purchases" value={myPurchases.length} icon="🛒" color="#60a5fa" />
          </div>

          {/* Quick browse by product category */}
          <div className="glass" style={{ borderRadius: '20px', padding: '24px' }}>
            <SectionTitle>Browse Products</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: '10px' }}>
              {[
                { to: '/listings?type=product&category=pesticide',   icon: '🧪', label: 'Pesticides',   color: '#f87171' },
                { to: '/listings?type=product&category=fertilizer',  icon: '🧴', label: 'Fertilizers', color: '#86efac' },
                { to: '/listings?type=product&category=seed',        icon: '🌱', label: 'Seeds',       color: '#4ade80' },
                { to: '/listings?type=product&category=animal_feed', icon: '🌾', label: 'Animal Feed', color: '#fbbf24' },
                { to: '/listings?type=product&category=tool',        icon: '🔧', label: 'Tools',       color: '#60a5fa' },
                { to: '/listings?type=product&category=medicine',    icon: '💊', label: 'Vet Medicine', color: '#a78bfa' },
              ].map((a) => (
                <Link key={a.to} to={a.to} style={{ textDecoration: 'none', padding: '14px 10px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = a.color + '40' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize: '24px', marginBottom: '6px' }}>{a.icon}</div>
                  <div style={{ color: a.color, fontWeight: 600, fontSize: '11px' }}>{a.label}</div>
                </Link>
              ))}
            </div>
          </div>

          {pending.length > 0 && (
            <div className="glass" style={{ borderRadius: '20px', padding: '24px' }}>
              <SectionTitle>Pending Sale Requests</SectionTitle>
              {pending.map((b) => (
                <div key={b.id} style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <p style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '14px' }}>{b.buyer_name}</p>
                      <p style={{ color: '#475569', fontSize: '12px' }}>📞 {b.buyer_phone}</p>
                    </div>
                    <span style={{ color: '#d4a0a0', fontWeight: 700 }}>{formatPrice(b.grand_total || b.total_amount)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleStatus(b.booking_id, 'approved')} className="btn-primary" style={{ flex: 1, padding: '8px' }}>✅ Confirm Sale</button>
                    <button onClick={() => handleStatus(b.booking_id, 'rejected')} className="btn-danger" style={{ flex: 1, padding: '8px', borderRadius: '10px' }}>❌ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'inventory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {myListings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '14px' }}>📦</div>
              <h3 style={{ color: '#f1f5f9', fontSize: '17px', fontWeight: 600, marginBottom: '8px' }}>No items listed</h3>
              <Link to="/create-listing" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '14px', padding: '10px 22px' }}>Add Item →</Link>
            </div>
          ) : myListings.map((l) => (
            <div key={l.id} className="glass card-hover" style={{ borderRadius: '16px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                {l.images?.[0] ? <img src={l.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📦'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link to={`/listings/${l.listing_id}`} style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>{l.title}</Link>
                <p style={{ color: '#334155', fontSize: '12px', marginTop: '2px' }}>📍 {l.location} · 👁 {l.views || 0} · {timeAgo(l.created_at)}</p>
                <p style={{ color: '#d4a0a0', fontWeight: 700, fontSize: '13px', marginTop: '3px' }}>{formatPrice(l.price)}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <Link to={`/listings/${l.listing_id}`} className="btn-ghost" style={{ textDecoration: 'none', padding: '6px 12px', fontSize: '12px' }}>View</Link>
                <button onClick={async () => { if (confirm('Delete?')) { await deleteListing(l.listing_id); setListings(ls => ls.filter(x => x.listing_id !== l.listing_id)) } }} className="btn-danger">Del</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'sales' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {salesRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '14px' }}>💼</div>
              <h3 style={{ color: '#f1f5f9', fontSize: '17px', fontWeight: 600 }}>No sale requests yet</h3>
            </div>
          ) : salesRequests.map((b) => (
            <div key={b.id} className="glass" style={{ borderRadius: '16px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: b.status === 'pending' ? '12px' : '0' }}>
                <div>
                  <p style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '14px' }}>{b.buyer_name}</p>
                  <p style={{ color: '#475569', fontSize: '12px' }}>📞 {b.buyer_phone} · <span style={{ textTransform: 'capitalize' }}>{b.status}</span></p>
                </div>
                <span style={{ color: '#d4a0a0', fontWeight: 700 }}>{formatPrice(b.grand_total || b.total_amount)}</span>
              </div>
              {b.status === 'pending' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleStatus(b.booking_id, 'approved')} className="btn-primary" style={{ flex: 1, padding: '8px' }}>✅ Confirm</button>
                  <button onClick={() => handleStatus(b.booking_id, 'rejected')} className="btn-danger" style={{ flex: 1, padding: '8px', borderRadius: '10px' }}>❌ Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'purchases' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {myPurchases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '14px' }}>🛒</div>
              <h3 style={{ color: '#f1f5f9', fontSize: '17px', fontWeight: 600 }}>No purchases yet</h3>
              <Link to="/listings" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '14px', padding: '10px 22px' }}>Browse Listings →</Link>
            </div>
          ) : myPurchases.map((b) => (
            <div key={b.id} className="glass" style={{ borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '14px', textTransform: 'capitalize' }}>{b.listing_type} Purchase</p>
                <p style={{ color: '#475569', fontSize: '12px' }}>From: {b.owner_name} · <span style={{ textTransform: 'capitalize' }}>{b.status}</span></p>
              </div>
              <span style={{ color: '#d4a0a0', fontWeight: 700 }}>{formatPrice(b.grand_total || b.total_amount)}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'notifications' && <NotificationsList notifications={notifications} setNotifications={setNotifications} />}
    </DashboardShell>
  )
}
