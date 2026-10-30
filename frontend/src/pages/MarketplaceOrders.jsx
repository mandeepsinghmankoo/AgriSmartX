import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  createMarketplaceReview,
  getMarketplaceOrderEvents,
  getMyMarketplaceOrderReviews,
  getMyMarketplaceOrders,
  updateMarketplaceOrderStatus,
} from '../lib/marketplace'
import { formatPrice, timeAgo } from '../lib/utils'

const STATUS_COLORS = {
  pending: '#fbbf24',
  confirmed: '#60a5fa',
  shipped: '#a78bfa',
  delivered: '#86efac',
  cancelled: '#f87171',
  rejected: '#f87171',
}

export default function MarketplaceOrders() {
  const { user, role } = useAuth()
  const [orders, setOrders] = useState([])
  const [events, setEvents] = useState([])
  const [reviews, setReviews] = useState([])
  const [tab, setTab] = useState(role === 'dealer' ? 'seller' : 'buyer')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busyOrder, setBusyOrder] = useState('')
  const [reviewingOrder, setReviewingOrder] = useState('')
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')

  useEffect(() => {
    let cancelled = false
    getMyMarketplaceOrders().then(async (myOrders) => {
      const [myEvents, myReviews] = await Promise.all([
        getMarketplaceOrderEvents(myOrders.map((order) => order.id)),
        getMyMarketplaceOrderReviews(myOrders.filter((order) => order.status === 'delivered').map((order) => order.id)),
      ])
      if (cancelled) return
      setOrders(myOrders)
      setEvents(myEvents)
      setReviews(myReviews)
    }).catch((error) => {
      if (!cancelled) setLoadError(error.message || 'Could not load orders.')
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [user?.id])

  async function changeStatus(order, status) {
    setBusyOrder(order.id)
    setActionError('')
    try {
      const updated = await updateMarketplaceOrderStatus(order.id, status)
      setOrders((current) => current.map((item) => item.id === updated.id ? updated : item))
      const [nextEvents, nextReviews] = await Promise.all([
        getMarketplaceOrderEvents(orders.map((item) => item.id)),
        status === 'delivered'
          ? getMyMarketplaceOrderReviews([...orders.filter((item) => item.status === 'delivered').map((item) => item.id), order.id])
          : Promise.resolve(reviews),
      ])
      setEvents(nextEvents)
      setReviews(nextReviews)
    } catch (error) {
      setActionError(error.message || 'Could not update this order.')
    } finally {
      setBusyOrder('')
    }
  }

  async function submitReview(event, order) {
    event.preventDefault()
    setBusyOrder(order.id)
    setActionError('')
    try {
      const review = await createMarketplaceReview(order.id, rating, reviewText.trim())
      setReviews((current) => [...current, review])
      setReviewingOrder('')
      setReviewText('')
      setRating(5)
    } catch (error) {
      setActionError(error.message || 'Could not submit your review.')
    } finally {
      setBusyOrder('')
    }
  }

  const visibleOrders = orders.filter((order) => tab === 'buyer' ? order.buyer_id === user?.id : order.seller_id === user?.id)

  if (loading) return <div role="status" style={{ color: '#94a3b8', textAlign: 'center', padding: '64px' }}>Loading orders...</div>

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <p style={{ color: '#d4a0a0', fontSize: '11px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>AGRI MARKETPLACE</p>
        <h1 style={{ color: '#f1f5f9', fontSize: '2rem', fontWeight: 700 }}>Product orders</h1>
        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '6px' }}>Track cash-on-delivery purchases and manage orders from your customers.</p>
      </div>

      {loadError && <p role="alert" style={{ color: '#f87171', marginBottom: '16px' }}>Orders could not be loaded: {loadError}</p>}
      {actionError && <p role="alert" style={{ color: '#f87171', marginBottom: '16px' }}>{actionError}</p>}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[
          { id: 'buyer', label: 'My purchases' },
          { id: 'seller', label: 'Customer orders' },
        ].map((item) => (
          <button key={item.id} type="button" onClick={() => setTab(item.id)}
            style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', background: tab === item.id ? 'rgba(212,160,160,0.15)' : 'rgba(255,255,255,0.03)', color: tab === item.id ? '#d4a0a0' : '#94a3b8' }}>
            {item.label} ({orders.filter((order) => item.id === 'buyer' ? order.buyer_id === user?.id : order.seller_id === user?.id).length})
          </button>
        ))}
      </div>

      {visibleOrders.length === 0 ? (
        <div className="glass" style={{ textAlign: 'center', padding: '48px 20px', borderRadius: '18px' }}>
          <div style={{ fontSize: '42px', marginBottom: '12px' }}>{tab === 'buyer' ? '🛒' : '📦'}</div>
          <h2 style={{ color: '#f1f5f9', fontSize: '17px', fontWeight: 600, marginBottom: '8px' }}>{tab === 'buyer' ? 'No product purchases yet' : 'No customer orders yet'}</h2>
          {tab === 'buyer' && <Link to="/marketplace" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '10px 18px', marginTop: '8px' }}>Browse products</Link>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {visibleOrders.map((order) => {
            const statusEvents = events.filter((event) => event.order_id === order.id)
            const hasReview = reviews.some((review) => review.order_id === order.id)
            const isBuyer = order.buyer_id === user?.id
            return (
              <article key={order.id} className="glass" style={{ borderRadius: '18px', padding: '20px', borderLeft: `3px solid ${STATUS_COLORS[order.status] || '#94a3b8'}` }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ width: '68px', height: '68px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {order.product_image ? <img src={order.product_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '28px' }}>📦</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link to={`/marketplace/${order.product_ref}`} style={{ color: '#f1f5f9', fontWeight: 700, textDecoration: 'none' }}>{order.product_title}</Link>
                    <p style={{ color: '#64748b', fontSize: '11px', marginTop: '4px' }}>{order.order_number} · {timeAgo(order.created_at)}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#f1f5f9', fontWeight: 700 }}>{formatPrice(order.total_amount)}</p>
                    <p style={{ color: STATUS_COLORS[order.status] || '#94a3b8', fontSize: '11px', textTransform: 'capitalize', marginTop: '4px' }}>{order.status}</p>
                    <p style={{ color: '#64748b', fontSize: '10px', marginTop: '3px' }}>COD · {order.payment_status}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', color: '#94a3b8', fontSize: '12px', marginBottom: '12px' }}>
                  <span>Qty: {order.quantity}</span>
                  <span>Cash on delivery</span>
                  <span>{isBuyer ? `Seller: ${order.seller_name}` : `Buyer: ${order.buyer_name} · ${order.buyer_phone}`}</span>
                </div>
                <p style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.5, marginBottom: '14px' }}>Delivery: {order.delivery_address}</p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: statusEvents.length ? '14px' : 0 }}>
                  {isBuyer && order.status === 'pending' && <button disabled={busyOrder === order.id} onClick={() => changeStatus(order, 'cancelled')} className="btn-ghost">Cancel order</button>}
                  {!isBuyer && order.status === 'pending' && <>
                    <button disabled={busyOrder === order.id} onClick={() => changeStatus(order, 'confirmed')} className="btn-primary">Confirm order</button>
                    <button disabled={busyOrder === order.id} onClick={() => changeStatus(order, 'rejected')} className="btn-ghost">Reject</button>
                  </>}
                  {!isBuyer && order.status === 'confirmed' && <button disabled={busyOrder === order.id} onClick={() => changeStatus(order, 'shipped')} className="btn-primary">Mark shipped</button>}
                  {!isBuyer && order.status === 'confirmed' && <button disabled={busyOrder === order.id} onClick={() => changeStatus(order, 'cancelled')} className="btn-ghost">Cancel order</button>}
                  {isBuyer && order.status === 'shipped' && <button disabled={busyOrder === order.id} onClick={() => changeStatus(order, 'delivered')} className="btn-primary">Confirm delivery</button>}
                  {isBuyer && order.status === 'delivered' && !hasReview && (
                    <button type="button" onClick={() => setReviewingOrder(reviewingOrder === order.id ? '' : order.id)} className="btn-ghost">Rate this purchase</button>
                  )}
                  {isBuyer && hasReview && <span style={{ color: '#86efac', fontSize: '12px', alignSelf: 'center' }}>✓ Review submitted</span>}
                </div>

                {isBuyer && reviewingOrder === order.id && !hasReview && (
                  <form onSubmit={(event) => submitReview(event, order)} style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '12px 0' }}>
                    <label style={{ color: '#94a3b8', fontSize: '12px' }}>
                      Rating
                      <select value={rating} onChange={(event) => setRating(Number(event.target.value))} className="input-dark" style={{ marginTop: '6px' }}>
                        {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{'★'.repeat(value)} ({value}/5)</option>)}
                      </select>
                    </label>
                    <textarea value={reviewText} onChange={(event) => setReviewText(event.target.value)} rows={3} maxLength={2000} className="input-dark" placeholder="Share your experience (optional)" />
                    <button disabled={busyOrder === order.id} className="btn-primary" style={{ alignSelf: 'flex-start' }}>{busyOrder === order.id ? 'Submitting...' : 'Submit review'}</button>
                  </form>
                )}

                {statusEvents.length > 0 && (
                  <ol style={{ display: 'flex', flexDirection: 'column', gap: '7px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', listStyle: 'none' }}>
                    {statusEvents.map((event) => (
                      <li key={event.id} style={{ color: '#64748b', fontSize: '11px' }}>
                        <span style={{ color: STATUS_COLORS[event.status] || '#94a3b8', textTransform: 'capitalize', fontWeight: 600 }}>{event.status}</span>
                        {event.note && ` — ${event.note}`} · {new Date(event.created_at).toLocaleString()}
                      </li>
                    ))}
                  </ol>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
