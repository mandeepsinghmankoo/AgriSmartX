// src/pages/dashboards/LivestockOwnerDashboard.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getMyListings, deleteListing } from '../../lib/listings'
import { getMyBookings, updateBookingStatus } from '../../lib/bookings'
import { getNotifications } from '../../lib/notifications'
import { formatPrice, timeAgo } from '../../lib/utils'
import { Loader, DashboardShell, StatCard, SectionTitle, NotificationsList } from './FarmerDashboard'

export default function LivestockOwnerDashboard() {
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

  const myAnimals = listings.filter((l) => l.type === 'livestock')
  const requests = bookings.filter((b) => b.owner_id === user?.id)
  const pending = requests.filter((b) => b.status === 'pending')
  const totalSales = requests.filter(b => b.status === 'completed').reduce((s, b) => s + (b.grand_total || 0), 0)
  const unread = notifications.filter((n) => !n.is_read).length

  async function handleStatus(bookingId, status) {
    await updateBookingStatus(bookingId, status)
    setBookings((bs) => bs.map((b) => b.booking_id === bookingId ? { ...b, status } : b))
  }

  const TABS = [
    { id: 'overview',      label: 'Overview',    icon: '📊' },
    { id: 'animals',       label: 'My Animals',  icon: '🐄', count: myAnimals.length },
    { id: 'requests',      label: 'Requests',    icon: '📥', count: pending.length, highlight: pending.length > 0 },
    { id: 'notifications', label: 'Alerts',      icon: '🔔', count: unread, highlight: unread > 0 },
  ]

  if (loading) return <Loader />

  return (
    <DashboardShell
      title={`${(profile?.name || user?.user_metadata?.name || 'Owner').split(' ')[0]}'s Livestock 🐄`}
      subtitle="Livestock Owner Dashboard"
      action={<Link to="/create-listing" className="btn-primary" style={{ textDecoration: 'none', padding: '10px 20px', fontSize: '13px' }}>+ List Animal</Link>}
      tabs={TABS} tab={tab} setTab={setTab}
    >
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '14px' }}>
            <StatCard label="Animals Listed" value={myAnimals.length} icon="🐄" color="#f97316" />
            <StatCard label="Pending Requests" value={pending.length} icon="📥" color="#fbbf24" />
            <StatCard label="Total Sales" value={`₹${totalSales.toLocaleString('en-IN')}`} icon="💰" color="#86efac" />
            <StatCard label="Unread" value={unread} icon="🔔" color="#d4a0a0" />
          </div>

          {pending.length > 0 && (
            <div className="glass" style={{ borderRadius: '20px', padding: '24px' }}>
              <SectionTitle>Pending Requests</SectionTitle>
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
                    <button onClick={() => handleStatus(b.booking_id, 'approved')} className="btn-primary" style={{ flex: 1, padding: '8px' }}>✅ Approve</button>
                    <button onClick={() => handleStatus(b.booking_id, 'rejected')} className="btn-danger" style={{ flex: 1, padding: '8px', borderRadius: '10px' }}>❌ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="glass" style={{ borderRadius: '20px', padding: '24px' }}>
            <SectionTitle>My Animals</SectionTitle>
            {myAnimals.slice(0, 4).map((l) => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                  {l.images?.[0] ? <img src={l.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🐄'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '13px' }}>{l.title}</p>
                  <p style={{ color: '#475569', fontSize: '11px' }}>{l.breed} · {l.animal_type} · {l.health_status}</p>
                </div>
                <span style={{ color: '#d4a0a0', fontWeight: 700, fontSize: '13px' }}>{formatPrice(l.price)}</span>
              </div>
            ))}
            {myAnimals.length === 0 && <p style={{ color: '#334155', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No animals listed yet.</p>}
          </div>
        </div>
      )}

      {tab === 'animals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {myAnimals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '14px' }}>🐄</div>
              <h3 style={{ color: '#f1f5f9', fontSize: '17px', fontWeight: 600, marginBottom: '8px' }}>No animals listed</h3>
              <Link to="/create-listing" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '14px', padding: '10px 22px' }}>List Animal →</Link>
            </div>
          ) : myAnimals.map((l) => (
            <div key={l.id} className="glass card-hover" style={{ borderRadius: '16px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                {l.images?.[0] ? <img src={l.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🐄'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link to={`/listings/${l.listing_id}`} style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>{l.title}</Link>
                <p style={{ color: '#475569', fontSize: '12px', marginTop: '2px' }}>{l.breed} · {l.animal_type} · {l.age} months · {l.health_status}</p>
                {l.milk_yield && <p style={{ color: '#f97316', fontSize: '12px' }}>🥛 {l.milk_yield} L/day</p>}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <Link to={`/listings/${l.listing_id}`} className="btn-ghost" style={{ textDecoration: 'none', padding: '6px 12px', fontSize: '12px' }}>View</Link>
                <button onClick={async () => { if (confirm('Delete?')) { await deleteListing(l.listing_id); setListings(ls => ls.filter(x => x.listing_id !== l.listing_id)) } }} className="btn-danger">Del</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '14px' }}>📥</div>
              <h3 style={{ color: '#f1f5f9', fontSize: '17px', fontWeight: 600 }}>No requests yet</h3>
            </div>
          ) : requests.map((b) => (
            <div key={b.id} className="glass" style={{ borderRadius: '16px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: b.status === 'pending' ? '12px' : '0' }}>
                <div>
                  <p style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '14px' }}>{b.buyer_name} · <span style={{ color: '#475569', fontWeight: 400 }}>{b.buyer_phone}</span></p>
                  <p style={{ color: '#334155', fontSize: '12px', marginTop: '2px', textTransform: 'capitalize' }}>{b.status}</p>
                </div>
                <span style={{ color: '#d4a0a0', fontWeight: 700 }}>{formatPrice(b.grand_total || b.total_amount)}</span>
              </div>
              {b.status === 'pending' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleStatus(b.booking_id, 'approved')} className="btn-primary" style={{ flex: 1, padding: '8px' }}>✅ Approve</button>
                  <button onClick={() => handleStatus(b.booking_id, 'rejected')} className="btn-danger" style={{ flex: 1, padding: '8px', borderRadius: '10px' }}>❌ Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'notifications' && <NotificationsList notifications={notifications} setNotifications={setNotifications} />}
    </DashboardShell>
  )
}
