// src/pages/Profile.jsx
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { uploadImage } from '../lib/storage'
import { formatDate } from '../lib/utils'

const LABEL = { color: '#64748b', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }

const ROLE_META = {
  farmer:          { label: 'Farmer',          icon: '🌾', color: '#86efac' },
  labor:           { label: 'Labor',           icon: '👨🌾', color: '#fbbf24' },
  equipment_owner: { label: 'Asset Owner',    icon: '🚜🐄', color: '#60a5fa' },
  dealer:          { label: 'Dealer',          icon: '🏪', color: '#a78bfa' },
}

export default function Profile() {
  const { user, profile, role } = useAuth()
  const meta = user?.user_metadata || {}
  const roleMeta = ROLE_META[role] || ROLE_META.farmer

  const [form, setForm] = useState({
    name: profile?.name || meta.name || '',
    phone: profile?.phone || meta.phone || '',
    location: profile?.location || '',
    state: profile?.state || '',
    pincode: profile?.pincode || '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(profile?.profile_image || null)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  function handleAvatar(e) {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSave(e) {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess(false)
    try {
      let profile_image = profile?.profile_image
      if (avatarFile) profile_image = await uploadImage(avatarFile, 'profiles')
      const { error: err } = await supabase.from('users').upsert({
        id: user.id, user_id: user.id, ...form, profile_image, updated_at: new Date().toISOString(),
      })
      if (err) throw err
      setSuccess(true)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const STATS = [
    { label: 'Rating',   value: profile?.rating ? `${profile.rating} ⭐` : '—', icon: '⭐' },
    { label: 'Listings', value: profile?.total_listings || 0, icon: '📋' },
    { label: 'Bookings', value: profile?.total_bookings || 0, icon: '🛒' },
    { label: 'Status',   value: profile?.is_verified ? 'Verified' : 'Pending', icon: profile?.is_verified ? '✅' : '⏳', color: profile?.is_verified ? '#d4a0a0' : '#fbbf24' },
  ]

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <p style={{ color: '#d4a0a0', fontSize: '12px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>ACCOUNT</p>
        <h1 style={{ color: '#f1f5f9', fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.3px' }}>My Profile</h1>
      </div>

      {/* Profile Header */}
      <div className="glass" style={{ borderRadius: '24px', padding: '28px', marginBottom: '20px', background: 'radial-gradient(ellipse at top left, rgba(167,116,116,0.05) 0%, transparent 60%), rgba(255,255,255,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(167,116,116,0.3)', boxShadow: '0 0 20px rgba(167,116,116,0.15)' }}>
              {avatarPreview
                ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#d4a0a0,#a77474)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 800, color: '#0f0a0a' }}>
                    {(form.name?.[0] || '?').toUpperCase()}
                  </div>
              }
            </div>
            <label style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '26px', height: '26px', background: 'linear-gradient(135deg,#d4a0a0,#a77474)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px' }}>
              ✏
              <input type="file" accept="image/*" onChange={handleAvatar} style={{ display: 'none' }} />
            </label>
          </div>
          <div>
            <h2 style={{ color: '#f1f5f9', fontSize: '20px', fontWeight: 700 }}>{form.name || 'Your Name'}</h2>
            <p style={{ color: '#475569', fontSize: '13px', marginTop: '2px' }}>{user?.email}</p>
            {/* Role badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px', background: `${roleMeta.color}15`, border: `1px solid ${roleMeta.color}30`, borderRadius: '20px', padding: '3px 10px' }}>
              <span style={{ fontSize: '13px' }}>{roleMeta.icon}</span>
              <span style={{ color: roleMeta.color, fontSize: '12px', fontWeight: 600 }}>{roleMeta.label}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {STATS.map((s) => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', marginBottom: '4px' }}>{s.icon}</div>
              <div style={{ color: s.color || '#f1f5f9', fontWeight: 700, fontSize: '14px' }}>{s.value}</div>
              <div style={{ color: '#334155', fontSize: '10px', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Form */}
      <div className="glass" style={{ borderRadius: '24px', padding: '28px' }}>
        <h2 style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '20px' }}>Edit Profile</h2>

        {error && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', color: '#f87171', fontSize: '13px' }}>⚠️ {error}</div>}
        {success && <div style={{ background: 'rgba(167,116,116,0.06)', border: '1px solid rgba(167,116,116,0.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', color: '#d4a0a0', fontSize: '13px' }}>✅ Profile updated!</div>}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div><label style={LABEL}>Full Name</label><input type="text" value={form.name} onChange={set('name')} className="input-dark" /></div>
            <div><label style={LABEL}>Phone</label><input type="tel" value={form.phone} onChange={set('phone')} className="input-dark" /></div>
            <div><label style={LABEL}>Village / City</label><input type="text" value={form.location} onChange={set('location')} placeholder="e.g. Nashik" className="input-dark" /></div>
            <div><label style={LABEL}>State</label><input type="text" value={form.state} onChange={set('state')} className="input-dark" /></div>
            <div><label style={LABEL}>Pincode</label><input type="text" value={form.pincode} onChange={set('pincode')} maxLength={6} className="input-dark" /></div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '4px' }}>
            {loading ? '⏳ Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Account Info */}
      <div className="glass" style={{ borderRadius: '24px', padding: '24px', marginTop: '20px' }}>
        <h2 style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '16px' }}>Account Info</h2>
        {[
          ['Email', user?.email],
          ['Role', `${roleMeta.icon} ${roleMeta.label}`],
          ['Joined', profile?.joined_at ? formatDate(profile.joined_at) : '—'],
          ['Verification', profile?.is_verified ? '✅ Verified' : '⏳ Pending KYC'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ color: '#475569', fontSize: '13px' }}>{k}</span>
            <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
