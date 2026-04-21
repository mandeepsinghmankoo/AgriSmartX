// src/pages/Listings.jsx
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getListings } from '../lib/listings'
import { ListingCard } from './Home'

const TYPES = [
  { value: '', label: 'All', icon: '🔍' },
  { value: 'equipment', label: 'Equipment', icon: '🚜' },
  { value: 'land', label: 'Land', icon: '🌾' },
  { value: 'labor', label: 'Labor', icon: '👨🌾' },
  { value: 'livestock', label: 'Livestock', icon: '🐄' },
]

function SkeletonCard() {
  return (
    <div style={{ background: 'rgba(17,24,39,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
      <div className="skeleton" style={{ height: '180px' }} />
      <div style={{ padding: '16px' }}>
        <div className="skeleton" style={{ height: '14px', borderRadius: '6px', marginBottom: '10px', width: '70%' }} />
        <div className="skeleton" style={{ height: '12px', borderRadius: '6px', marginBottom: '14px', width: '50%' }} />
        <div className="skeleton" style={{ height: '16px', borderRadius: '6px', width: '40%' }} />
      </div>
    </div>
  )
}

export default function Listings() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || '',
    location: searchParams.get('location') || '',
    minPrice: '',
    maxPrice: '',
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    setLoading(true)
    getListings({ ...filters })
      .then(setListings)
      .catch(() => setListings([]))
      .finally(() => setLoading(false))
  }, [filters])

  const set = (k) => (val) => {
    setFilters((f) => ({ ...f, [k]: val }))
    if (k === 'type') setSearchParams(val ? { type: val } : {})
  }

  const activeCount = [filters.location, filters.minPrice, filters.maxPrice].filter(Boolean).length

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{ color: '#d4a0a0', fontSize: '12px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>MARKETPLACE</p>
        <h1 style={{ color: '#f1f5f9', fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.3px' }}>Browse Listings</h1>
      </div>

      {/* Type filter pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => set('type')(t.value)}
            style={{
              padding: '8px 18px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: filters.type === t.value
                ? 'linear-gradient(135deg,#d4a0a0,#a77474)'
                : 'rgba(255,255,255,0.05)',
              color: filters.type === t.value ? '#0f0a0a' : '#64748b',
              boxShadow: filters.type === t.value ? '0 4px 14px rgba(167, 116, 116,0.25)' : 'none',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}

        {/* Advanced filter toggle */}
        <button
          onClick={() => setShowFilters((s) => !s)}
          style={{
            marginLeft: 'auto',
            padding: '8px 18px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 600,
            border: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: showFilters ? 'rgba(167, 116, 116,0.08)' : 'rgba(255,255,255,0.04)',
            color: showFilters ? '#d4a0a0' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          ⚙ Filters {activeCount > 0 && <span style={{ background: '#d4a0a0', color: '#0f0a0a', borderRadius: '50%', width: '18px', height: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800 }}>{activeCount}</span>}
        </button>
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <div className="glass animate-fade-down" style={{ borderRadius: '16px', padding: '20px', marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1', minWidth: '160px' }}>
            <label style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Location</label>
            <input type="text" placeholder="e.g. Nashik, Pune..." value={filters.location}
              onChange={(e) => set('location')(e.target.value)} className="input-dark" />
          </div>
          <div style={{ flex: '1', minWidth: '120px' }}>
            <label style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Min Price ₹</label>
            <input type="number" placeholder="0" value={filters.minPrice}
              onChange={(e) => set('minPrice')(e.target.value)} className="input-dark" />
          </div>
          <div style={{ flex: '1', minWidth: '120px' }}>
            <label style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Max Price ₹</label>
            <input type="number" placeholder="∞" value={filters.maxPrice}
              onChange={(e) => set('maxPrice')(e.target.value)} className="input-dark" />
          </div>
          <button
            onClick={() => setFilters({ type: filters.type, location: '', minPrice: '', maxPrice: '' })}
            className="btn-ghost"
            style={{ padding: '12px 18px', fontSize: '13px' }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Results count */}
      {!loading && (
        <p style={{ color: '#334155', fontSize: '13px', marginBottom: '20px' }}>
          {listings.length === 0 ? 'No listings found' : `${listings.length} listing${listings.length !== 1 ? 's' : ''} found`}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : listings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🔍</div>
          <h3 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No listings found</h3>
          <p style={{ color: '#475569', fontSize: '14px' }}>Try adjusting your filters or search in a different location.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {listings.map((l, i) => <ListingCard key={l.id} listing={l} index={i} />)}
        </div>
      )}
    </div>
  )
}


