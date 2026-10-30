// src/pages/Marketplace.jsx
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  getMarketplaceProducts,
  getMarketplaceReviews,
  getProduct,
  placeMarketplaceOrder,
} from '../lib/marketplace'
import { formatPrice } from '../lib/utils'

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
  const { id } = useParams()
  return id ? <ProductDetail productId={id} /> : <MarketplaceCatalog />
}

function ProductDetail({ productId }) {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [result, setResult] = useState({ productId: null, product: null, error: '' })
  const [reviewResult, setReviewResult] = useState({ productId: null, reviews: [], error: '' })
  const [checkout, setCheckout] = useState({ buyerName: '', buyerPhone: '', deliveryAddress: '', quantity: 1 })
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [placedOrder, setPlacedOrder] = useState(null)

  useEffect(() => {
    let cancelled = false
    getProduct(productId)
      .then((data) => {
        if (!cancelled) setResult({ productId, product: data, error: '' })
      })
      .catch((loadError) => {
        if (!cancelled) setResult({ productId, product: null, error: loadError.message || 'Could not load this product.' })
      })
    return () => { cancelled = true }
  }, [productId])

  const loading = result.productId !== productId
  const product = loading ? null : result.product
  const error = loading ? '' : result.error
  const isSeller = product?.seller_id === user?.id
  const currentReviews = product && reviewResult.productId === product.id ? reviewResult.reviews : []
  const loadedProductId = product?.id

  useEffect(() => {
    if (!loadedProductId) return undefined
    let cancelled = false
    getMarketplaceReviews(loadedProductId)
      .then((reviews) => {
        if (!cancelled) setReviewResult({ productId: loadedProductId, reviews, error: '' })
      })
      .catch((loadError) => {
        if (!cancelled) setReviewResult({ productId: loadedProductId, reviews: [], error: loadError.message || 'Could not load reviews.' })
      })
    return () => { cancelled = true }
  }, [loadedProductId])

  async function handleOrderSubmit(event) {
    event.preventDefault()
    if (!user) {
      navigate('/login', { state: { from: `/marketplace/${product.product_id}` } })
      return
    }
    const quantity = Number(checkout.quantity)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > Number(product.stock || 0)) {
      setOrderError('Choose a quantity that is currently in stock.')
      return
    }

    setOrderLoading(true)
    setOrderError('')
    try {
      const order = await placeMarketplaceOrder({
        productId: product.id,
        quantity,
        buyerName: checkout.buyerName || profile?.name || user.user_metadata?.name || '',
        buyerPhone: checkout.buyerPhone || profile?.phone || user.user_metadata?.phone || '',
        deliveryAddress: checkout.deliveryAddress,
      })
      setPlacedOrder(order)
      setCheckout((form) => ({ ...form, quantity: 1 }))
      setResult((current) => current.productId === productId
        ? { ...current, product: { ...current.product, stock: Math.max(0, Number(current.product.stock || 0) - quantity) } }
        : current)
    } catch (submitError) {
      setOrderError(submitError.message || 'Could not place your order.')
    } finally {
      setOrderLoading(false)
    }
  }

  if (loading) return <div role="status" style={{ color: '#94a3b8', textAlign: 'center', padding: '64px' }}>Loading product...</div>
  if (error || !product) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h1 style={{ color: '#f1f5f9', fontSize: '20px', marginBottom: '12px' }}>{error ? 'Could not load product' : 'Product not found'}</h1>
        {error && <p role="alert" style={{ color: '#f87171', marginBottom: '16px' }}>{error}</p>}
        <Link to="/marketplace" className="btn-primary" style={{ textDecoration: 'none', padding: '10px 18px' }}>Back to marketplace</Link>
      </div>
    )
  }

  const category = CAT_COLORS[product.category] || CAT_COLORS.other
  const averageRating = currentReviews.length
    ? currentReviews.reduce((sum, review) => sum + review.rating, 0) / currentReviews.length
    : Number(product.rating || 0)
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <Link to="/marketplace" style={{ display: 'inline-block', color: '#94a3b8', textDecoration: 'none', marginBottom: '20px' }}>← Back to marketplace</Link>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: '20px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,240px),1fr))', gap: '24px', borderRadius: '20px', padding: '24px' }}>
            <div style={{ minHeight: '280px', borderRadius: '14px', overflow: 'hidden', background: category.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {product.images?.[0]
                ? <img src={product.images[0]} alt={product.title} style={{ width: '100%', height: '100%', minHeight: '280px', objectFit: 'cover' }} />
                : <span style={{ fontSize: '72px' }}>{category.icon}</span>}
            </div>
            <div>
              <p style={{ color: category.color, textTransform: 'capitalize', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>{product.category?.replace('_', ' ') || 'Product'}</p>
              <h1 style={{ color: '#f1f5f9', fontSize: '28px', fontWeight: 700, marginBottom: '12px' }}>{product.title}</h1>
              {product.brand && <p style={{ color: '#94a3b8', marginBottom: '12px' }}>Brand: {product.brand}</p>}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span style={{ color: category.color, fontSize: '26px', fontWeight: 800 }}>{formatPrice(product.price)}</span>
                {product.original_price > product.price && <span style={{ color: '#64748b', textDecoration: 'line-through' }}>{formatPrice(product.original_price)}</span>}
                <span style={{ color: '#64748b', fontSize: '13px' }}>/{product.unit || 'piece'}</span>
              </div>
              <p style={{ color: product.stock > 0 ? '#86efac' : '#f87171', fontSize: '13px', marginBottom: '18px' }}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </p>
              {product.description && <p style={{ color: '#94a3b8', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: '20px' }}>{product.description}</p>}
              {product.seller_name && <p style={{ color: '#64748b', fontSize: '13px' }}>Sold by {product.seller_name}</p>}
              <p style={{ color: '#fbbf24', fontSize: '13px', marginTop: '10px' }}>
                {averageRating ? `★ ${averageRating.toFixed(1)}` : 'No ratings yet'}
                {currentReviews.length > 0 && <span style={{ color: '#64748b' }}> · {currentReviews.length} verified review{currentReviews.length === 1 ? '' : 's'}</span>}
              </p>
            </div>
          </div>

          <section className="glass" style={{ borderRadius: '20px', padding: '24px' }}>
            <h2 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Customer reviews</h2>
            {reviewResult.productId === product.id && reviewResult.error && <p role="alert" style={{ color: '#f87171', marginBottom: '12px' }}>{reviewResult.error}</p>}
            {currentReviews.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '13px' }}>No reviews yet. Buyers can review after delivery is confirmed.</p>
            ) : currentReviews.map((review) => (
              <article key={review.id} style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '14px 0' }}>
                <p style={{ color: '#fbbf24', fontSize: '14px' }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
                <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>{review.review || 'Verified purchase'}</p>
                <p style={{ color: '#475569', fontSize: '11px', marginTop: '6px' }}>Verified buyer · {review.buyer_name} · {new Date(review.created_at).toLocaleDateString()}</p>
              </article>
            ))}
          </section>
        </div>

        <aside className="glass" style={{ borderRadius: '20px', padding: '22px', position: 'sticky', top: '90px' }}>
          <h2 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Buy this product</h2>
          <p style={{ color: '#86efac', fontSize: '12px', marginBottom: '16px' }}>Cash on delivery · Pay when it arrives</p>
          {placedOrder && (
            <div role="status" style={{ background: 'rgba(134,239,172,0.08)', border: '1px solid rgba(134,239,172,0.2)', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
              <p style={{ color: '#86efac', fontWeight: 700, fontSize: '13px' }}>Order placed: {placedOrder.order_number}</p>
              <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>The seller will confirm your order. Track updates in your orders.</p>
              <Link to="/orders" style={{ display: 'inline-block', color: '#86efac', fontSize: '12px', marginTop: '8px' }}>View order status →</Link>
            </div>
          )}
          {orderError && <p role="alert" style={{ color: '#f87171', fontSize: '12px', marginBottom: '12px' }}>{orderError}</p>}
          {isSeller ? (
            <p style={{ color: '#64748b', fontSize: '13px' }}>This is your product listing.</p>
          ) : Number(product.stock || 0) <= 0 ? (
            <p style={{ color: '#f87171', fontSize: '13px' }}>This product is currently out of stock.</p>
          ) : (
            <form onSubmit={handleOrderSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ color: '#94a3b8', fontSize: '12px' }}>
                Quantity
                <input type="number" min="1" max={product.stock} required value={checkout.quantity}
                  onChange={(event) => setCheckout((form) => ({ ...form, quantity: event.target.value }))}
                  className="input-dark" style={{ marginTop: '6px' }} />
              </label>
              <label style={{ color: '#94a3b8', fontSize: '12px' }}>
                Full name
                <input required value={checkout.buyerName || profile?.name || user?.user_metadata?.name || ''}
                  onChange={(event) => setCheckout((form) => ({ ...form, buyerName: event.target.value }))}
                  className="input-dark" style={{ marginTop: '6px' }} />
              </label>
              <label style={{ color: '#94a3b8', fontSize: '12px' }}>
                Phone
                <input required type="tel" value={checkout.buyerPhone || profile?.phone || user?.user_metadata?.phone || ''}
                  onChange={(event) => setCheckout((form) => ({ ...form, buyerPhone: event.target.value }))}
                  className="input-dark" style={{ marginTop: '6px' }} />
              </label>
              <label style={{ color: '#94a3b8', fontSize: '12px' }}>
                Delivery address
                <textarea required rows={3} value={checkout.deliveryAddress}
                  onChange={(event) => setCheckout((form) => ({ ...form, deliveryAddress: event.target.value }))}
                  className="input-dark" style={{ marginTop: '6px', resize: 'vertical' }} />
              </label>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '13px' }}>
                <span>Order total</span>
                <strong style={{ color: '#f1f5f9' }}>{formatPrice(product.price * (Number(checkout.quantity) || 0))}</strong>
              </div>
              <button type="submit" disabled={orderLoading || !product.stock} className="btn-primary" style={{ width: '100%', padding: '12px' }}>
                {orderLoading ? 'Placing order...' : user ? 'Place COD order' : 'Sign in to buy'}
              </button>
              <p style={{ color: '#64748b', fontSize: '11px', lineHeight: 1.5 }}>Your order is confirmed by the seller. Payment is collected on delivery.</p>
            </form>
          )}
        </aside>
      </div>
    </div>
  )
}

function MarketplaceCatalog() {
  const [searchParams] = useSearchParams()
  const [result, setResult] = useState({ key: null, products: [], error: '' })
  const [activeCat, setActiveCat] = useState(searchParams.get('category') || '')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const filterKey = JSON.stringify([activeCat, search, minPrice, maxPrice])

  useEffect(() => {
    let cancelled = false
    getMarketplaceProducts({ category: activeCat || undefined, search: search || undefined, minPrice: minPrice || undefined, maxPrice: maxPrice || undefined })
      .then((products) => {
        if (!cancelled) setResult({ key: filterKey, products, error: '' })
      })
      .catch((error) => {
        if (!cancelled) setResult({ key: filterKey, products: [], error: error.message || 'Could not load marketplace products.' })
      })
    return () => { cancelled = true }
  }, [activeCat, search, minPrice, maxPrice, filterKey])

  const loading = result.key !== filterKey
  const products = loading ? [] : result.products
  const loadError = loading ? '' : result.error

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ color: '#34d399', fontSize: '11px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>AGRI MARKETPLACE</p>
        <h1 style={{ color: '#f1f5f9', fontSize: '2rem', fontWeight: 700 }}>Shop Agri Products</h1>
      </div>

      {loadError && <p role="alert" style={{ color: '#f87171', marginBottom: '16px' }}>Products could not be loaded: {loadError}</p>}

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
