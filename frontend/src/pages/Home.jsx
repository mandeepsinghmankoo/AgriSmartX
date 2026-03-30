// src/pages/Home.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getListings } from '../lib/listings'
import { getMarketplaceProducts } from '../lib/marketplace'
import { isAgriRole } from '../lib/roles'
import { formatPrice, timeAgo } from '../lib/utils'

// ── Agri Listing Card ──
export function ListingCard({ listing, index = 0 }) {
  const icons = { equipment: '🚜', land: '🌾', livestock: '🐄', labor: '👨🌾' }
  const typeColors = {
    equipment: { bg: 'rgba(245,158,11,0.1)',  text: '#fbbf24', border: 'rgba(245,158,11,0.2)' },
    land:      { bg: 'rgba(167,116,116,0.1)', text: '#d4a0a0', border: 'rgba(167,116,116,0.2)' },
    labor:     { bg: 'rgba(96,165,250,0.1)',  text: '#60a5fa', border: 'rgba(96,165,250,0.2)' },
    livestock: { bg: 'rgba(167,139,250,0.1)', text: '#a78bfa', border: 'rgba(167,139,250,0.2)' },
  }
  const tc = typeColors[listing.type] || typeColors.land
  return (
    <Link to={`/listings/${listing.listing_id}`} className="card-hover animate-fade-up"
      style={{ background: 'rgba(20,14,22,0.75)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden', textDecoration: 'none', display: 'block', animationDelay: `${index * 0.07}s`, animationFillMode: 'both' }}>
      <div style={{ height: '180px', background: 'rgba(255,255,255,0.03)', position: 'relative', overflow: 'hidden' }}>
        {listing.images?.[0]
          ? <img src={listing.images[0]} alt={listing.title} onError={e => { e.currentTarget.style.display = 'none' }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '52px' }}>{icons[listing.type] || '📦'}</div>
        }
        <div style={{ position: 'absolute', top: '10px', left: '10px', background: tc.bg, color: tc.text, border: `1px solid ${tc.border}`, borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, backdropFilter: 'blur(8px)' }}>
          {listing.type}
        </div>
        <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.55)', color: '#94a3b8', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', backdropFilter: 'blur(8px)' }}>
          {listing.rent_or_sell === 'sell' ? '🏷 Sale' : '🔄 Rent'}
        </div>
      </div>
      <div style={{ padding: '14px' }}>
        <h3 style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '14px', marginBottom: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.title}</h3>
        <p style={{ color: '#475569', fontSize: '12px', marginBottom: '10px' }}>📍 {listing.location}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#d4a0a0', fontWeight: 700, fontSize: '15px' }}>{formatPrice(listing.price)}<span style={{ color: '#475569', fontSize: '11px', fontWeight: 400 }}>/{listing.price_unit}</span></span>
          {listing.owner_rating && <span style={{ color: '#fbbf24', fontSize: '12px' }}>⭐ {listing.owner_rating}</span>}
        </div>
      </div>
    </Link>
  )
}

// ── Marketplace Product Card ──
const CAT_META = {
  pesticide:    { color: '#f87171', bg: 'rgba(239,68,68,0.1)',   icon: '🧪' },
  seed:         { color: '#86efac', bg: 'rgba(134,239,172,0.1)', icon: '🌱' },
  fertilizer:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  icon: '🪣' },
  vet_medicine: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  icon: '💊' },
  tool:         { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', icon: '🔧' },
  feed:         { color: '#f97316', bg: 'rgba(249,115,22,0.1)',  icon: '🌾' },
  other:        { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', icon: '📦' },
}

function ProductCard({ product, index = 0 }) {
  const cat = CAT_META[product.category] || CAT_META.other
  const discount = product.original_price && product.original_price > product.price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : null
  return (
    <Link to={`/marketplace/${product.product_id}`} className="card-hover animate-fade-up"
      style={{ background: 'rgba(20,14,22,0.75)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden', textDecoration: 'none', display: 'block', animationDelay: `${index * 0.06}s`, animationFillMode: 'both' }}>
      <div style={{ height: '180px', background: cat.bg, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {product.images?.[0]
          ? <img src={product.images[0]} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: '56px' }}>{cat.icon}</span>
        }
        {discount && <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#ef4444', color: 'white', borderRadius: '8px', padding: '3px 8px', fontSize: '11px', fontWeight: 700 }}>-{discount}%</div>}
        <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: cat.color, borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, backdropFilter: 'blur(8px)' }}>
          {cat.icon} {product.category?.replace('_', ' ')}
        </div>
      </div>
      <div style={{ padding: '14px' }}>
        {product.brand && <p style={{ color: '#64748b', fontSize: '10px', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{product.brand}</p>}
        <h3 style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '14px', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ color: cat.color, fontWeight: 700, fontSize: '16px' }}>{formatPrice(product.price)}</span>
          {product.original_price > product.price && <span style={{ color: '#475569', fontSize: '12px', textDecoration: 'line-through' }}>{formatPrice(product.original_price)}</span>}
        </div>
        <span style={{ color: product.stock > 0 ? '#86efac' : '#f87171', fontSize: '11px' }}>
          {product.stock > 0 ? '✅ In Stock' : '❌ Out of Stock'}
        </span>
      </div>
    </Link>
  )
}

function SkeletonCard() {
  return (
    <div style={{ background: 'rgba(20,14,22,0.75)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
      <div className="skeleton" style={{ height: '180px' }} />
      <div style={{ padding: '14px' }}>
        <div className="skeleton" style={{ height: '13px', borderRadius: '6px', marginBottom: '8px', width: '75%' }} />
        <div className="skeleton" style={{ height: '11px', borderRadius: '6px', marginBottom: '10px', width: '50%' }} />
        <div className="skeleton" style={{ height: '15px', borderRadius: '6px', width: '40%' }} />
      </div>
    </div>
  )
}

const STATS = [
  { label: 'Farmers Connected', value: '50K+', icon: '👨🌾' },
  { label: 'Active Listings',   value: '12K+', icon: '📋' },
  { label: 'Agri Products',     value: '8K+',  icon: '📦' },
  { label: 'Districts Covered', value: '200+', icon: '📍' },
]

const AGRI_CATS = [
  { type: 'equipment', label: 'Equipment', icon: '🚜', color: '#f59e0b', glow: 'rgba(245,158,11,0.15)' },
  { type: 'land',      label: 'Land',      icon: '🌾', color: '#d4a0a0', glow: 'rgba(167,116,116,0.15)' },
  { type: 'labor',     label: 'Labor',     icon: '👨🌾', color: '#60a5fa', glow: 'rgba(96,165,250,0.15)' },
  { type: 'livestock', label: 'Livestock', icon: '🐄', color: '#a78bfa', glow: 'rgba(167,139,250,0.15)' },
]

const MARKET_CATS = [
  { id: 'seed',         label: 'Seeds',       icon: '🌱', color: '#86efac' },
  { id: 'fertilizer',   label: 'Fertilizers', icon: '🪣', color: '#fbbf24' },
  { id: 'pesticide',    label: 'Pesticides',  icon: '🧪', color: '#f87171' },
  { id: 'vet_medicine', label: 'Vet Medicine',icon: '💊', color: '#60a5fa' },
  { id: 'tool',         label: 'Farm Tools',  icon: '🔧', color: '#a78bfa' },
  { id: 'feed',         label: 'Animal Feed', icon: '🌾', color: '#f97316' },
]

const FEATURES = [
  { icon: '🚜', title: 'Equipment Leasing',  desc: 'Rent tractors, harvesters & machinery by hour or day.' },
  { icon: '🌾', title: 'Land Leasing',       desc: 'Find fertile farmland for seasonal or yearly lease.' },
  { icon: '👨🌾', title: 'Labor Hiring',     desc: 'Connect with skilled farm workers in your area.' },
  { icon: '🐄', title: 'Livestock Market',   desc: 'Buy, sell or lease cattle, goats & dairy animals.' },
  { icon: '🧪', title: 'Agri Products',      desc: 'Shop seeds, fertilizers, pesticides & vet medicine.' },
  { icon: '🔒', title: 'Verified & Trusted', desc: 'Every listing and seller is verified for quality.' },
]

export default function Home() {
  const { user, role } = useAuth()
  const agri = user && isAgriRole(role)
  const buyer = user && role === 'buyer'

  const [listings, setListings]   = useState([])
  const [products, setProducts]   = useState([])
  const [listingCat, setListingCat] = useState('')
  const [productCat, setProductCat] = useState('')
  const [loadingL, setLoadingL]   = useState(true)
  const [loadingP, setLoadingP]   = useState(true)
  const [search, setSearch]       = useState('')

  // Always load both sections for guests; load relevant one for logged-in users
  useEffect(() => {
    if (!buyer) {
      setLoadingL(true)
      getListings({ type: listingCat || undefined })
        .then(d => setListings(d.slice(0, 8)))
        .catch(() => {})
        .finally(() => setLoadingL(false))
    }
  }, [listingCat, buyer])

  useEffect(() => {
    if (!agri) {
      setLoadingP(true)
      getMarketplaceProducts({ category: productCat || undefined, random: !productCat, limit: 8 })
        .then(setProducts)
        .catch(() => {})
        .finally(() => setLoadingP(false))
    }
  }, [productCat, agri])

  return (
    <div>
      {/* ── HERO ── */}
      <section style={{
        borderRadius: '24px', padding: 'clamp(48px,8vw,88px) clamp(20px,5vw,48px)',
        marginBottom: '56px', minHeight: '480px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(2px)', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(140,72,55,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', right: '-60px', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(22,158,158,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '720px', width: '100%' }}>
          <div className="animate-fade-down" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(167,116,116,0.08)', border: '1px solid rgba(167,116,116,0.2)', borderRadius: '20px', padding: '6px 16px', marginBottom: '22px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d4a0a0', display: 'inline-block', animation: 'pulse-glow 2s infinite' }} />
            <span style={{ color: '#d4a0a0', fontSize: '11px', fontWeight: 600, letterSpacing: '1px' }}>INDIA'S #1 AGRICULTURAL PLATFORM</span>
          </div>

          <h1 className="animate-fade-up" style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '18px', color: '#f1f5f9', letterSpacing: '-0.5px' }}>
            Grow Smarter with{' '}
            <span className="gradient-text text-glow">AgriSmartX</span>
          </h1>

          <p className="animate-fade-up delay-100" style={{ color: '#64748b', fontSize: '16px', lineHeight: 1.7, marginBottom: '32px', maxWidth: '560px', margin: '0 auto 32px' }}>
            Lease equipment, rent farmland, hire labor, buy livestock — and shop seeds, fertilizers & agri products. Everything agriculture, in one place.
          </p>

          {/* Search */}
          <div className="animate-fade-up delay-200" style={{ display: 'flex', gap: '8px', maxWidth: '520px', margin: '0 auto 28px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '6px', backdropFilter: 'blur(20px)' }}>
            <input type="text" placeholder="Search equipment, land, seeds, labor..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', color: '#f1f5f9', fontSize: '14px', outline: 'none', padding: '10px 12px' }} />
            <Link to={`/listings?search=${search}`} className="btn-primary"
              style={{ padding: '10px 20px', fontSize: '13px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Search
            </Link>
          </div>

          <div className="animate-fade-up delay-300" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to={user ? '/listings' : '/signup'} className="btn-primary" style={{ textDecoration: 'none', padding: '12px 28px' }}>
              {user ? 'Browse Listings →' : 'Get Started Free →'}
            </Link>
            <Link to={user ? '/marketplace' : '/signup'} className="btn-ghost" style={{ textDecoration: 'none', padding: '12px 28px' }}>
              {user ? 'Shop Products' : 'Explore Platform'}
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ marginBottom: '56px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '14px' }}>
          {STATS.map((s, i) => (
            <div key={s.label} className="glass animate-fade-up card-hover"
              style={{ borderRadius: '16px', padding: '22px', textAlign: 'center', animationDelay: `${i * 0.09}s`, animationFillMode: 'both' }}>
              <div style={{ fontSize: '26px', marginBottom: '7px' }}>{s.icon}</div>
              <div className="gradient-text" style={{ fontSize: '26px', fontWeight: 800, lineHeight: 1 }}>{s.value}</div>
              <div style={{ color: '#475569', fontSize: '11px', marginTop: '5px', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AGRI LISTINGS SECTION (hidden for buyer-only) ── */}
      {!buyer && (
        <section style={{ marginBottom: '56px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <p style={{ color: '#d4a0a0', fontSize: '11px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>AGRI MARKETPLACE</p>
              <h2 style={{ color: '#f1f5f9', fontSize: '1.5rem', fontWeight: 700 }}>Equipment, Land, Labor & Livestock</h2>
            </div>
            <Link to={user ? '/listings' : '/login'} className="btn-ghost" style={{ textDecoration: 'none', padding: '8px 18px', fontSize: '13px' }}>View All →</Link>
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {[{ type: '', label: 'All', icon: '🔍', color: '#d4a0a0' }, ...AGRI_CATS].map(c => (
              <button key={c.type} onClick={() => setListingCat(c.type)}
                style={{ padding: '7px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', border: `1px solid ${listingCat === c.type ? c.color + '50' : 'rgba(255,255,255,0.08)'}`, background: listingCat === c.type ? `${c.color}18` : 'rgba(255,255,255,0.04)', color: listingCat === c.type ? c.color : '#64748b' }}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>

          {loadingL ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '16px' }}>
              {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : listings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>
              <p>No listings yet. <Link to="/signup" style={{ color: '#d4a0a0' }}>Be the first to post →</Link></p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '16px' }}>
              {listings.map((l, i) => <ListingCard key={l.id} listing={l} index={i} />)}
            </div>
          )}
        </section>
      )}

      {/* ── MARKETPLACE PRODUCTS SECTION (hidden for agri-only) ── */}
      {!agri && (
        <section style={{ marginBottom: '56px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <p style={{ color: '#34d399', fontSize: '11px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>AGRI PRODUCTS STORE</p>
              <h2 style={{ color: '#f1f5f9', fontSize: '1.5rem', fontWeight: 700 }}>Seeds, Fertilizers, Pesticides & More</h2>
            </div>
            <Link to={user ? '/marketplace' : '/login'} className="btn-ghost" style={{ textDecoration: 'none', padding: '8px 18px', fontSize: '13px' }}>Shop All →</Link>
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {[{ id: '', label: 'All', icon: '🔍', color: '#34d399' }, ...MARKET_CATS].map(c => (
              <button key={c.id} onClick={() => setProductCat(c.id)}
                style={{ padding: '7px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', border: `1px solid ${productCat === c.id ? c.color + '50' : 'rgba(255,255,255,0.08)'}`, background: productCat === c.id ? `${c.color}18` : 'rgba(255,255,255,0.04)', color: productCat === c.id ? c.color : '#64748b' }}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>

          {loadingP ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '16px' }}>
              {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>
              <p>No products yet. <Link to="/signup" style={{ color: '#34d399' }}>Become a seller →</Link></p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '16px' }}>
              {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
        </section>
      )}

      {/* ── FEATURES ── */}
      <section style={{ marginBottom: '56px' }}>
        <div className="glass" style={{ borderRadius: '24px', padding: '40px 36px', background: 'radial-gradient(ellipse at 30% 50%, rgba(140,72,55,0.06) 0%, transparent 60%), rgba(255,255,255,0.02)' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <p style={{ color: '#d4a0a0', fontSize: '11px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>EVERYTHING AGRICULTURE</p>
            <h2 style={{ color: '#f1f5f9', fontSize: '1.75rem', fontWeight: 700 }}>One Platform, All Your Agri Needs</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '28px' }}>
            {FEATURES.map((f, i) => (
              <div key={f.title} className="animate-fade-up" style={{ animationDelay: `${i * 0.08}s`, animationFillMode: 'both' }}>
                <div style={{ fontSize: '30px', marginBottom: '10px' }}>{f.icon}</div>
                <h3 style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>{f.title}</h3>
                <p style={{ color: '#475569', fontSize: '13px', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      {!user && (
        <section style={{ marginBottom: '32px' }}>
          <div style={{ borderRadius: '24px', padding: '56px 40px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(140,72,55,0.1) 0%, rgba(22,158,158,0.08) 100%)', border: '1px solid rgba(167,116,116,0.15)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,116,116,0.08) 0%, transparent 70%)' }} />
            <h2 style={{ color: '#f1f5f9', fontSize: '2rem', fontWeight: 700, marginBottom: '10px' }}>
              Ready to <span className="gradient-text">Transform</span> Agriculture?
            </h2>
            <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '28px' }}>
              Join 50,000+ farmers, laborers, equipment owners & buyers on AgriSmartX.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/signup" className="btn-primary animate-pulse-glow" style={{ textDecoration: 'none', padding: '13px 32px', fontSize: '15px' }}>
                Join AgriSmartX →
              </Link>
              <Link to="/listings" className="btn-ghost" style={{ textDecoration: 'none', padding: '13px 32px', fontSize: '15px' }}>
                Browse Listings
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
