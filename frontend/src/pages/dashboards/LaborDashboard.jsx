// src/pages/dashboards/LaborDashboard.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getMyListings, deleteListing } from '../../lib/listings'
import { getMyBookings, updateBookingStatus } from '../../lib/bookings'
import { getNotifications } from '../../lib/notifications'
import { supabase } from '../../lib/supabase'
import { formatPrice, formatDate, timeAgo } from '../../lib/utils'
import { Loader, DashboardShell, StatCard, SectionTitle, BookingsList, NotificationsList } from './FarmerDashboard'

const LABEL = { color: '#64748b', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }

export default function LaborDashboard() {
  const { user, profile, setProfile } = useAuth()
  const [listings, setListings] = useState([])
  const [bookings, setBookings] = useState([])
  const [notifications, setNotifications] = useState([])
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [profileForm, setProfileForm] = useState({
    bio: profile?.bio || '',
    skills: profile?.skills?.join(', ') || '',
    experience_years: profile?.experience_years || '',
    daily_rate: profile?.daily_rate || '',
    available_for_work: profile?.available_for_work ?? true,
    work_radius_km: profile?.work_radius_km || 30,
    languages: profile?.languages?.join(', ') || '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      getMyListings().catch(() => []),
      getMyBookings().catch(() => []),
      getNotifications().catch(() => []),
    ]).then(([l, b, n]) => { setListings(l); setBookings(b); setNotifications(n) })
      .finally(() => setLoading(false))
  }, [])

  const jobRequests = bookings.filter((b) => b.owner_id === user?.id)
  const unread = notifications.filter((n) => !n.is_read).length
  const myProfile = listings.find((l) => l.type === 'labor')

  async function handleStatusUpdate(bookingId, status) {
    await updateBookingStatus(bookingId, status)
    setBookings((bs) => bs.map((b) => b.booking_id === bookingId ? { ...b, status } : b))
  }

  async function saveWorkProfile(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const updates = {
        bio: profileForm.bio,
        skills: profileForm.skills.split(',').map(s => s.trim()).filter(Boolean),
        experience_years: parseInt(profileForm.experience_years) || null,
        daily_rate: parseFloat(profileForm.daily_rate) || null,
        available_for_work: profileForm.available_for_work,
        work_radius_km: parseInt(profileForm.work_radius_km) || 30,
        languages: profileForm.languages.split(',').map(s => s.trim()).filter(Boolean),
      }
      await supabase.from('users').update(updates).eq('id', user.id)
      setProfile((p) => ({ ...p, ...updates }))
    } catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  const TABS = [
    { id: 'overview',      label: 'Overview',      icon: '📊' },
    { id: 'work_profile',  label: 'Work Profile',  icon: '👤' },
    { id: 'find_work',     label: 'Find Work',     icon: '🔍' },
    { id: 'job_requests',  label: 'Job Requests',  icon: '📥', count: jobRequests.filter(b => b.status === 'pending').length, highlight: jobRequests.filter(b => b.status === 'pending').length > 0 },
    { id: 'notifications', label: 'Alerts',        icon: '🔔', count: unread, highlight: unread > 0 },
  ]

  if (loading) return <Loader />

  return (
    <DashboardShell
      title={`${(profile?.name || user?.user_metadata?.name || 'Labor').split(' ')[0]}'s Workspace 👨🌾`}
      subtitle="Labor Dashboard"
      action={
        <Link to="/create-listing" className="btn-primary" style={{ textDecoration: 'none', padding: '10px 20px', fontSize: '13px' }}>
          + Post Yourself
        </Link>
      }
      tabs={TABS} tab={tab} setTab={setTab}
    >
      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '14px' }}>
            <StatCard label="Available" value={profile?.available_for_work ? 'Yes ✅' : 'No ❌'} icon="💼" color="#86efac" />
            <StatCard label="Daily Rate" value={profile?.daily_rate ? formatPrice(profile.daily_rate) : '—'} icon="💰" color="#fbbf24" />
            <StatCard label="Job Requests" value={jobRequests.length} icon="📥" color="#60a5fa" />
            <StatCard label="Unread" value={unread} icon="🔔" color="#f97316" />
          </div>

          {/* Availability toggle */}
          <div className="glass" style={{ borderRadius: '20px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '15px' }}>Available for Work</p>
              <p style={{ color: '#475569', fontSize: '12px', marginTop: '2px' }}>Toggle to show/hide yourself to farmers</p>
            </div>
            <button
              onClick={async () => {
                const newVal = !profile?.available_for_work
                await supabase.from('users').update({ available_for_work: newVal }).eq('id', user.id)
                setProfile((p) => ({ ...p, available_for_work: newVal }))
              }}
              style={{ width: '52px', height: '28px', borderRadius: '14px', border: 'none', cursor: 'pointer', transition: 'all 0.3s', background: profile?.available_for_work ? 'linear-gradient(135deg,#86efac,#4ade80)' : 'rgba(255,255,255,0.1)', position: 'relative' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'white', position: 'absolute', top: '4px', transition: 'all 0.3s', left: profile?.available_for_work ? '28px' : '4px' }} />
            </button>
          </div>

          {/* Pending job requests */}
          {jobRequests.filter(b => b.status === 'pending').length > 0 && (
            <div className="glass" style={{ borderRadius: '20px', padding: '24px' }}>
              <SectionTitle>Pending Job Requests</SectionTitle>
              {jobRequests.filter(b => b.status === 'pending').map((b) => (
                <div key={b.id} style={{ padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <p style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '14px' }}>{b.buyer_name}</p>
                      <p style={{ color: '#475569', fontSize: '12px' }}>📞 {b.buyer_phone}</p>
                      {b.start_date && <p style={{ color: '#334155', fontSize: '12px' }}>📅 {formatDate(b.start_date)}{b.end_date ? ` → ${formatDate(b.end_date)}` : ''}</p>}
                      {b.special_instructions && <p style={{ color: '#475569', fontSize: '12px', fontStyle: 'italic', marginTop: '4px' }}>"{b.special_instructions}"</p>}
                    </div>
                    <span style={{ color: '#d4a0a0', fontWeight: 700, fontSize: '16px' }}>{formatPrice(b.grand_total || b.total_amount)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleStatusUpdate(b.booking_id, 'approved')} className="btn-primary" style={{ flex: 1, padding: '8px' }}>✅ Accept</button>
                    <button onClick={() => handleStatusUpdate(b.booking_id, 'rejected')} className="btn-danger" style={{ flex: 1, padding: '8px', borderRadius: '10px' }}>❌ Decline</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── WORK PROFILE ── */}
      {tab === 'work_profile' && (
        <div className="glass" style={{ borderRadius: '20px', padding: '28px' }}>
          <SectionTitle>Your Work Profile</SectionTitle>
          <form onSubmit={saveWorkProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={LABEL}>Bio / About You</label>
              <textarea value={profileForm.bio} onChange={(e) => setProfileForm(f => ({ ...f, bio: e.target.value }))} rows={3} placeholder="Describe your experience and what you can do..." className="input-dark" style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={LABEL}>Skills (comma separated)</label>
                <input type="text" value={profileForm.skills} onChange={(e) => setProfileForm(f => ({ ...f, skills: e.target.value }))} placeholder="Harvesting, Ploughing, Irrigation" className="input-dark" />
              </div>
              <div>
                <label style={LABEL}>Languages</label>
                <input type="text" value={profileForm.languages} onChange={(e) => setProfileForm(f => ({ ...f, languages: e.target.value }))} placeholder="Hindi, Marathi" className="input-dark" />
              </div>
              <div>
                <label style={LABEL}>Experience (years)</label>
                <input type="number" value={profileForm.experience_years} onChange={(e) => setProfileForm(f => ({ ...f, experience_years: e.target.value }))} placeholder="5" className="input-dark" />
              </div>
              <div>
                <label style={LABEL}>Daily Rate (₹)</label>
                <input type="number" value={profileForm.daily_rate} onChange={(e) => setProfileForm(f => ({ ...f, daily_rate: e.target.value }))} placeholder="500" className="input-dark" />
              </div>
              <div>
                <label style={LABEL}>Work Radius (km)</label>
                <input type="number" value={profileForm.work_radius_km} onChange={(e) => setProfileForm(f => ({ ...f, work_radius_km: e.target.value }))} placeholder="30" className="input-dark" />
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary" style={{ width: '100%' }}>
              {saving ? '⏳ Saving...' : 'Save Work Profile'}
            </button>
          </form>
        </div>
      )}

      {/* ── FIND WORK ── */}
      {tab === 'find_work' && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🔍</div>
          <h3 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Find Farm Work Near You</h3>
          <p style={{ color: '#475569', fontSize: '14px', marginBottom: '24px' }}>Browse farmers looking for labor in your area</p>
          <Link to="/listings?type=labor" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', padding: '12px 28px' }}>
            Browse Work Listings →
          </Link>
        </div>
      )}

      {tab === 'job_requests' && <BookingsList bookings={jobRequests} emptyMsg="No job requests yet" />}
      {tab === 'notifications' && <NotificationsList notifications={notifications} setNotifications={setNotifications} />}
    </DashboardShell>
  )
}
