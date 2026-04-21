// src/pages/CropSales.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getCropPosts, expressInterest, getInterestsForPost, acceptInterest, getMyCropPosts, getMyInterests, deleteCropPost } from '../lib/cropSales'
import { formatPrice, timeAgo } from '../lib/utils'

const CROPS = ['All', 'Wheat', 'Maize', 'Rice', 'Brinjal', 'Potato', 'Tomato', 'Onion', 'Garlic', 'Soybean', 'Cotton', 'Other']

const QUALITY_COLORS = {
  'Premium':  { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  'Grade A':  { color: '#86efac', bg: 'rgba(134,239,172,0.1)' },
  'Grade B':  { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  'Standard': { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
}

const STATUS_COLORS = {
  pending:  { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)' },
  accepted: { color: '#86efac', bg: 'rgba(134,239,172,0.1)', border: 'rgba(134,239,172,0.2)' },
  rejected: { color: '#f87171', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)' },
}

// ── Interest Modal (buyer sends interest) ──
function InterestModal({ post, onClose, onDone }) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await expressInterest(post.id, message)
      onDone()
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass" style={{ borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '440px' }}>
        <h3 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '17px', marginBottom: '6px' }}>Express Interest</h3>
        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
          {post.title} · {post.quantity} {post.unit} · {formatPrice(post.price_per_unit)}/{post.unit}
        </p>
        {error && <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '12px' }}>⚠️ {error}</p>}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Message to Farmer (optional)</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} className="input-dark" style={{ resize: 'vertical' }} placeholder="e.g. I can arrange transport, interested in full lot..." />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 2, padding: '12px', borderRadius: '12px' }}>
              {loading ? '⏳ Sending...' : '🤝 Send Interest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Interests Panel (farmer sees all requests for a post) ──
function InterestsPanel({ post, onClose, onAccepted }) {
  const [interests, setInterests] = useState([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(null)

  useEffect(() => {
    getInterestsForPost(post.id).then(setInterests).finally(() => setLoading(false))
  }, [post.id])

  async function handleAccept(interestId) {
    setAccepting(interestId)
    try {
      await acceptInterest(post.id, interestId)
      setInterests(prev => prev.map(i => ({ ...i, status: i.id === interestId ? 'accepted' : 'rejected' })))
      onAccepted()
    } finally { setAccepting(null) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass" style={{ borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '520px', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '17px' }}>Buyer Requests</h3>
            <p style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>{post.title}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        {loading ? (
          <p style={{ color: '#475569', textAlign: 'center', padding: '20px' }}>Loading...</p>
        ) : interests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
            <p style={{ color: '#475569', fontSize: '14px' }}>No requests yet</p>
          </div>
        ) : interests.map(interest => {
          const ss = STATUS_COLORS[interest.status] || STATUS_COLORS.pending
          return (
            <div key={interest.id} style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${ss.border}`, marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <p style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '14px' }}>{interest.buyer_name}</p>
                  <p style={{ color: '#475569', fontSize: '12px' }}>📞 {interest.buyer_phone} · {timeAgo(interest.created_at)}</p>
                </div>
                <span style={{ background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, borderRadius: '20px', padding: '2px 10px', fontSize: '11px', fontWeight: 600 }}>
                  {interest.status}
                </span>
              </div>
              {interest.message && <p style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic', marginBottom: '10px' }}>"{interest.message}"</p>}
              {interest.status === 'pending' && post.status === 'open' && (
                <button onClick={() => handleAccept(interest.id)} disabled={accepting === interest.id} className="btn-primary"
                  style={{ width: '100%', padding: '9px', borderRadius: '10px', background: 'linear-gradient(135deg,#86efac,#4ade80)', color: '#0f172a' }}>
                  {accepting === interest.id ? '⏳ Accepting...' : '✅ Accept this Buyer'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Crop Card ──
function CropCard({ post, isFarmer, onInterest, onViewRequests }) {
  const qc = QUALITY_COLORS[post.quality] || QUALITY_COLORS['Standard']
  const isSold = post.status === 'sold'

  return (
    <div className="glass card-hover animate-fade-up" style={{ borderRadius: '18px', overflow: 'hidden', opacity: isSold ? 0.7 : 1 }}>
      {/* Image / Banner */}
      <div style={{ height: '160px', background: 'rgba(134,239,172,0.06)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {post.images?.[0]
          ? <img src={post.images[0]} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: '56px' }}>🌾</span>
        }
        <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px' }}>
          <span style={{ background: qc.bg, color: qc.color, borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, backdropFilter: 'blur(8px)' }}>{post.quality}</span>
          {isSold && <span style={{ background: 'rgba(239,68,68,0.8)', color: 'white', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 700 }}>SOLD</span>}
        </div>
        <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', color: '#86efac', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, backdropFilter: 'blur(8px)' }}>
          🌱 {post.crop_type}
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <h3 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>{post.title}</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <span style={{ color: '#86efac', fontWeight: 800, fontSize: '17px' }}>{formatPrice(post.price_per_unit)}<span style={{ color: '#475569', fontWeight: 400, fontSize: '12px' }}>/{post.unit}</span></span>
          {post.is_negotiable && <span style={{ color: '#fbbf24', fontSize: '11px', fontWeight: 600 }}>💬 Negotiable</span>}
        </div>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <span style={{ color: '#64748b', fontSize: '12px' }}>📦 {post.quantity} {post.unit}</span>
          <span style={{ color: '#64748b', fontSize: '12px' }}>📍 {post.location}{post.state ? `, ${post.state}` : ''}</span>
          {post.harvest_date && <span style={{ color: '#64748b', fontSize: '12px' }}>🗓 {post.harvest_date}</span>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#334155', fontSize: '11px' }}>👨‍🌾 {post.farmer_name} · {timeAgo(post.created_at)}</span>
          {isFarmer
            ? <button onClick={() => onViewRequests(post)} style={{ background: 'rgba(134,239,172,0.1)', border: '1px solid rgba(134,239,172,0.2)', color: '#86efac', borderRadius: '10px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                📥 View Requests
              </button>
            : !isSold && (
              <button onClick={() => onInterest(post)} className="btn-primary"
                style={{ padding: '7px 16px', fontSize: '12px', borderRadius: '10px', background: 'linear-gradient(135deg,#86efac,#4ade80)', color: '#0f172a' }}>
                🤝 I'm Interested
              </button>
            )
          }
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──
export default function CropSales() {
  const { user, role } = useAuth()
  const isFarmer = role === 'farmer'

  const [posts, setPosts]           = useState([])
  const [myPosts, setMyPosts]       = useState([])
  const [myInterests, setMyInterests] = useState([])
  const [loading, setLoading]       = useState(true)
  const [tab, setTab]               = useState(isFarmer ? 'my_posts' : 'feed')
  const [cropFilter, setCropFilter] = useState('All')
  const [search, setSearch]         = useState('')
  const [interestPost, setInterestPost] = useState(null)   // buyer modal
  const [requestsPost, setRequestsPost] = useState(null)   // farmer modal
  const [sentIds, setSentIds]       = useState(new Set())

  useEffect(() => {
    const filters = {}
    if (cropFilter !== 'All') filters.crop_type = cropFilter
    if (search) filters.search = search
    setLoading(true)
    Promise.all([
      getCropPosts(filters).catch(() => []),
      isFarmer ? getMyCropPosts().catch(() => []) : Promise.resolve([]),
      !isFarmer ? getMyInterests().catch(() => []) : Promise.resolve([]),
    ]).then(([p, mp, mi]) => {
      setPosts(p); setMyPosts(mp); setMyInterests(mi)
      setSentIds(new Set(mi.map(i => i.crop_post_id)))
    }).finally(() => setLoading(false))
  }, [cropFilter, search, isFarmer])

  function refreshMyPosts() {
    getMyCropPosts().then(setMyPosts)
  }

  const TABS = isFarmer
    ? [
        { id: 'my_posts', label: 'My Crop Posts', icon: '🌾', count: myPosts.length },
        { id: 'feed',     label: 'Browse Feed',   icon: '🔍' },
      ]
    : [
        { id: 'feed',        label: 'Crop Feed',      icon: '🌾' },
        { id: 'my_interests',label: 'My Interests',   icon: '🤝', count: myInterests.length },
      ]

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <p style={{ color: '#86efac', fontSize: '11px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>BULK CROP MARKET</p>
          <h1 style={{ color: '#f1f5f9', fontSize: '1.75rem', fontWeight: 700 }}>Crop Sales 🌾</h1>
        </div>
        {isFarmer && (
          <Link to="/post-crop" className="btn-primary" style={{ textDecoration: 'none', padding: '10px 20px', fontSize: '13px', background: 'linear-gradient(135deg,#86efac,#4ade80)', color: '#0f172a' }}>
            + Post Crop
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', padding: '4px', marginBottom: '24px' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, padding: '9px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: tab === t.id ? 'rgba(255,255,255,0.08)' : 'transparent', color: tab === t.id ? '#f1f5f9' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
            {t.icon} {t.label}
            {t.count !== undefined && (
              <span style={{ background: 'rgba(255,255,255,0.08)', color: '#64748b', borderRadius: '8px', padding: '1px 6px', fontSize: '10px', fontWeight: 700 }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Feed tab */}
      {tab === 'feed' && (
        <>
          {/* Search + filter */}
          <div className="glass" style={{ borderRadius: '16px', padding: '14px 18px', marginBottom: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input type="text" placeholder="🔍 Search crops..." value={search} onChange={e => setSearch(e.target.value)}
              className="input-dark" style={{ flex: 1, minWidth: '160px' }} />
            <button onClick={() => { setSearch(''); setCropFilter('All') }} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', borderRadius: '10px', padding: '9px 14px', cursor: 'pointer', fontSize: '13px' }}>Clear</button>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {CROPS.map(c => (
              <button key={c} onClick={() => setCropFilter(c)}
                style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: `1px solid ${cropFilter === c ? 'rgba(134,239,172,0.4)' : 'rgba(255,255,255,0.08)'}`, background: cropFilter === c ? 'rgba(134,239,172,0.12)' : 'rgba(255,255,255,0.04)', color: cropFilter === c ? '#86efac' : '#64748b' }}>
                {c}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '16px' }}>
              {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: '300px', borderRadius: '18px' }} />)}
            </div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ fontSize: '52px', marginBottom: '14px' }}>🌾</div>
              <h3 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: 600 }}>No crop posts found</h3>
              <p style={{ color: '#475569', fontSize: '14px', marginTop: '8px' }}>Try adjusting your filters</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '16px' }}>
              {posts.map(post => (
                <CropCard key={post.id} post={post} isFarmer={isFarmer && post.farmer_id === user?.id}
                  onInterest={p => { if (!sentIds.has(p.id)) setInterestPost(p) }}
                  onViewRequests={setRequestsPost}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Farmer: My Posts tab */}
      {tab === 'my_posts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {myPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ fontSize: '52px', marginBottom: '14px' }}>🌾</div>
              <h3 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No crop posts yet</h3>
              <Link to="/post-crop" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', padding: '10px 24px', background: 'linear-gradient(135deg,#86efac,#4ade80)', color: '#0f172a' }}>
                Post Your First Crop →
              </Link>
            </div>
          ) : myPosts.map(post => {
            const isSold = post.status === 'sold'
            return (
              <div key={post.id} className="glass card-hover" style={{ borderRadius: '16px', padding: '18px', display: 'flex', gap: '14px', alignItems: 'center', opacity: isSold ? 0.75 : 1 }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(134,239,172,0.08)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
                  {post.images?.[0] ? <img src={post.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🌾'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <p style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</p>
                    <span style={{ background: isSold ? 'rgba(239,68,68,0.1)' : 'rgba(134,239,172,0.1)', color: isSold ? '#f87171' : '#86efac', borderRadius: '20px', padding: '1px 8px', fontSize: '10px', fontWeight: 600, flexShrink: 0 }}>
                      {isSold ? 'SOLD' : 'OPEN'}
                    </span>
                  </div>
                  <p style={{ color: '#475569', fontSize: '12px' }}>🌱 {post.crop_type} · 📦 {post.quantity} {post.unit} · {formatPrice(post.price_per_unit)}/{post.unit}</p>
                  <p style={{ color: '#334155', fontSize: '11px', marginTop: '2px' }}>📍 {post.location} · {timeAgo(post.created_at)}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button onClick={() => setRequestsPost(post)} style={{ background: 'rgba(134,239,172,0.1)', border: '1px solid rgba(134,239,172,0.2)', color: '#86efac', borderRadius: '10px', padding: '7px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    📥 Requests
                  </button>
                  <button onClick={async () => { if (confirm('Delete this post?')) { await deleteCropPost(post.id); setMyPosts(p => p.filter(x => x.id !== post.id)) } }}
                    className="btn-danger" style={{ padding: '7px 12px', fontSize: '12px' }}>Del</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Buyer: My Interests tab */}
      {tab === 'my_interests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {myInterests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ fontSize: '52px', marginBottom: '14px' }}>🤝</div>
              <h3 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: 600 }}>No interests sent yet</h3>
              <p style={{ color: '#475569', fontSize: '14px', marginTop: '8px' }}>Browse the feed and express interest in crops</p>
            </div>
          ) : myInterests.map(interest => {
            const ss = STATUS_COLORS[interest.status] || STATUS_COLORS.pending
            return (
              <div key={interest.id} className="glass" style={{ borderRadius: '16px', padding: '18px', borderLeft: `3px solid ${ss.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '14px', marginBottom: '3px' }}>{interest.crop_posts?.title || 'Crop Post'}</p>
                    <p style={{ color: '#475569', fontSize: '12px' }}>🌱 {interest.crop_posts?.crop_type} · 👨‍🌾 {interest.crop_posts?.farmer_name}</p>
                    {interest.message && <p style={{ color: '#64748b', fontSize: '12px', fontStyle: 'italic', marginTop: '4px' }}>"{interest.message}"</p>}
                    <p style={{ color: '#334155', fontSize: '11px', marginTop: '4px' }}>{timeAgo(interest.created_at)}</p>
                  </div>
                  <span style={{ background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, flexShrink: 0 }}>
                    {interest.status}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      {interestPost && (
        <InterestModal
          post={interestPost}
          onClose={() => setInterestPost(null)}
          onDone={() => { setSentIds(prev => new Set([...prev, interestPost.id])); setInterestPost(null) }}
        />
      )}
      {requestsPost && (
        <InterestsPanel
          post={requestsPost}
          onClose={() => setRequestsPost(null)}
          onAccepted={() => { refreshMyPosts(); setRequestsPost(null) }}
        />
      )}
    </div>
  )
}
