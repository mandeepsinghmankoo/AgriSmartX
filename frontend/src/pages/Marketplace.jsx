// src/pages/Marketplace.jsx
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getMarketplaceProducts } from '../lib/marketplace'
import { formatPrice } from '../lib/utils'
import { Link } from 'react-router-dom'

const CATS = [
  { id: '',            label: 'All',          icon: '🔍', color: '#34d399' },
  { id: 'seed',        label: 'Seeds',        icon: '🌱', color: '#86efac' },
  { id: 'fertilizer',  label: 'Fertilizers',  icon: '🪣', color: '#fbbf24' },
  { id: 'pesticide',   label: 'Pesticides',   icon: '🧪', color: '#f87171' },
  { id: 'vet_medicine',label: 'Vet Medicine', icon: '💊', color: '#60a5fa' },
  { id: 'tool',        label: 'Farm Tools',   icon: '🔧', color: '#a78bfa' },
  { id: 'feed',        label: 'Animal Feed',  icon: '🌾', color: '#f97316' },
  { id: 'other',       label: 'Other',        icon: '📦', color: '#94a3b8' },
]

const CAT_COLORS = {
  pesticide:    { color: '#f87171', bg: 'rgba(239,68,68,0.1)',    icon: '🧪' },
  seed:         { color: '#86efac', bg: 'rgba(134,239,172,0.1)',  icon: '🌱' },
  fertilizer:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   icon: '🪣' },
  vet_medicine: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   icon: '💊' },
  tool:         { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',  icon: '🔧' },
  feed:         { color: '#f97316', bg: 'rgba(249,115,22,0.1)',   icon: '🌾' },
  other:        { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  icon: '📦' },
}

function SkeletonCard() {
  return (
    <div style={{ background: 'rgba(20,14,22,0.75)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
      <div className="skeleton" style={{ height: '180px' }} />
      <div style={{ padding: '14px' }}>
        <div className="skeleton" style={{ height: '12px', borderRadius: '6px', marginBottom: '8px', width: '60%' }} />
        <div className="skeleton" style={{ height: '14px', borderRadius: '6px', marginBottom: '8px', width: '80%' }} />
        <div className="skeleton" style={{ height: '16px', borderRadius: '6px', width: '40%' }} />
      </div>
    </div>
  )
}

export default function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCat, setActiveCat] = useState(searchParams.get('category') || '')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  useEffect(() => {
    setLoading(true)
    getMarketplaceProducts({ category: activeCat || undefined, search: search || undefined, minPrice: minPrice || undefined, maxPrice: maxPrice || undefined })
      .then(setProducts).catch(() => setProducts([])).finally(() => setLoading(false))
  }, [activeCat, search, minPrice, maxPrice])

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ color: '#34d399', fontSize: '11px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>AGRI MARKETPLACE</p>
        <h1 style={{ color: '#f1f5f9', fontSize: '2rem', fontWeight: 700 }}>Shop Agri Products</h1>
      </div>

      {/* Search + filters */}
      <div className="glass" style={{ borderRadius: '16px', padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="text" placeholder="🔍 Search products..." value={search} onChange={e => setSearch(e.target.value)}
          className="input-dark" style={{ flex: '1', minWidth: '180px' }} />
        <input type="number" placeholder="Min ₹" value={minPrice} onChange={e => setMinPrice(e.target.value)}
          className="input-dark" style={{ width: '100px' }} />
        <input type="number" placeholder="Max ₹" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
          className="input-dark" style={{ width: '100px' }} />
        <button onClick={() => { setSearch(''); setMinPrice(''); setMaxPrice(''); setActiveCat('') }}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', borderRadius: '10px', padding: '10px 16px', cursor: 'pointer', fontSize: '13px' }}>
          Clear
        </button>
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {CATS.map(c => (
          <button key={c.id} onClick={() => setActiveCat(c.id)}
            style={{
              padding: '7px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              border: `1px solid ${activeCat === c.id ? c.color + '50' : 'rgba(255,255,255,0.08)'}`,
              background: activeCat === c.id ? `${c.color}18` : 'rgba(255,255,255,0.04)',
              color: activeCat === c.id ? c.color : '#64748b',
            }}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Count */}
      {!loading && <p style={{ color: '#334155', fontSize: '13px', marginBottom: '16px' }}>{products.length} product{products.length !== 1 ? 's' : ''} found</p>}

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '16px' }}>
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '52px', marginBottom: '14px' }}>📦</div>
          <h3 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No products found</h3>
          <p style={{ color: '#475569', fontSize: '14px' }}>Try adjusting your filters</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '16px' }}>
          {products.map((p, i) => {
            const cat = CAT_COLORS[p.category] || CAT_COLORS.other
            const discount = p.original_price && p.original_price > p.price
              ? Math.round(((p.original_price - p.price) / p.original_price) * 100) : null
            return (
              <Link key={p.id} to={`/marketplace/${p.product_id}`} className="card-hover animate-fade-up"
                style={{ background: 'rgba(20,14,22,0.75)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden', textDecoration: 'none', display: 'block', animationDelay: `${i * 0.05}s`, animationFillMode: 'both' }}>
                <div style={{ height: '180px', background: cat.bg, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.images?.[0]
                    ? <img src={p.images[0]} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '56px' }}>{cat.icon}</span>
                  }
                  {discount && <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#ef4444', color: 'white', borderRadius: '8px', padding: '3px 8px', fontSize: '11px', fontWeight: 700 }}>-{discount}%</div>}
                  <div style={{ position: 'absolute', top: '10px', right: '10px', background: cat.bg, color: cat.color, border: `1px solid ${cat.color}30`, borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, backdropFilter: 'blur(8px)' }}>
                    {cat.icon} {p.category?.replace('_', ' ')}
                  </div>
                </div>
                <div style={{ padding: '14px' }}>
                  {p.brand && <p style={{ color: '#64748b', fontSize: '10px', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{p.brand}</p>}
                  <h3 style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '14px', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ color: cat.color, fontWeight: 700, fontSize: '16px' }}>{formatPrice(p.price)}</span>
                    {p.original_price > p.price && <span style={{ color: '#475569', fontSize: '12px', textDecoration: 'line-through' }}>{formatPrice(p.original_price)}</span>}
                    <span style={{ color: '#475569', fontSize: '11px' }}>/{p.unit || 'piece'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {p.rating > 0 && <span style={{ color: '#fbbf24', fontSize: '12px' }}>⭐ {p.rating}</span>}
                    <span style={{ color: p.stock > 0 ? '#86efac' : '#f87171', fontSize: '11px' }}>
                      {p.stock > 0 ? '✅ In Stock' : '❌ Out of Stock'}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
