// src/pages/ListingDetail.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getListing } from '../lib/listings'
import { createBooking } from '../lib/bookings'
import { getListingReviews } from '../lib/reviews'
import { useAuth } from '../contexts/AuthContext'
import { formatPrice, formatDate, timeAgo } from '../lib/utils'

const TYPE_COLORS = {
  equipment: { bg: 'rgba(245,158,11,0.1)', text: '#fbbf24', border: 'rgba(245,158,11,0.2)' },
  land: { bg: 'rgba(167, 116, 116,0.1)', text: '#d4a0a0', border: 'rgba(167, 116, 116,0.2)' },
  labor: { bg: 'rgba(96,165,250,0.1)', text: '#60a5fa', border: 'rgba(96,165,250,0.2)' },
  livestock: { bg: 'rgba(167,139,250,0.1)', text: '#a78bfa', border: 'rgba(167,139,250,0.2)' },
}

export default function ListingDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [imgIdx, setImgIdx] = useState(0)
  const [booking, setBooking] = useState({ start_date: '', end_date: '', quantity: 1, special_instructions: '' })
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState(false)

  useEffect(() => {
    getListing(id).then((d) => { setListing(d); setLoading(false) }).catch(() => setLoading(false))
    getListingReviews(id).then(setReviews).catch(() => setReviews([]))
  }, [id])

  async function handleBook(e) {
    e.preventDefault()
    if (!user) return navigate('/login')
    setBookingLoading(true); setBookingError('')
    try {
      const days = booking.start_date && booking.end_date
        ? Math.max(1, Math.ceil((new Date(booking.end_date) - new Date(booking.start_date)) / 86400000))
        : 1
      const total = listing.price * days * booking.quantity
      await createBooking({
        listing_id: listing.id,           // uuid FK required by bookings table
        listing_type: listing.type,
        owner_id: listing.owner_id, owner_name: listing.owner_name,
        // only include dates if both are filled — never send empty strings to timestamp columns
        ...(booking.start_date && booking.end_date
          ? { start_date: booking.start_date, end_date: booking.end_date }
          : {}),
        duration: days, quantity: booking.quantity,
        unit_price: listing.price, total_amount: total,
        service_charge: total * 0.05, grand_total: total * 1.05,
        // only include if not empty
        ...(booking.special_instructions ? { special_instructions: booking.special_instructions } : {}),
      })
      setBookingSuccess(true)
    } catch (err) { setBookingError(err.message) }
    finally { setBookingLoading(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: '3px solid rgba(167, 116, 116,0.2)', borderTopcolor: '#d4a0a0', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#475569', fontSize: '14px' }}>Loading listing...</p>
      </div>
    </div>
  )

  if (!listing) return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: '56px', marginBottom: '16px' }}>😕</div>
      <h3 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: 600 }}>Listing not found</h3>
    </div>
  )

  const images = listing.images?.length ? listing.images : []
  const tc = TYPE_COLORS[listing.type] || TYPE_COLORS.land
  const icons = { equipment: '🚜', land: '🌾', livestock: '🐄', labor: '👨🌾' }

  const days = booking.start_date && booking.end_date
    ? Math.max(1, Math.ceil((new Date(booking.end_date) - new Date(booking.start_date)) / 86400000))
    : 1
  const estimatedTotal = listing.price * days * booking.quantity * 1.05

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px', alignItems: 'start' }}>

        {/* ── LEFT ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Image Gallery */}
          <div style={{ borderRadius: '20px', overflow: 'hidden', position: 'relative', background: 'rgba(17,24,39,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ height: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              {images.length > 0 ? (
                <img src={images[imgIdx]} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s' }} />
              ) : (
                <span style={{ fontSize: '80px' }}>{icons[listing.type] || '📦'}</span>
              )}
              {/* Badges */}
              <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', gap: '8px' }}>
                <span style={{ background: tc.bg, color: tc.text, border: `1px solid ${tc.border}`, borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: 600, backdropFilter: 'blur(8px)' }}>
                  {listing.type}
                </span>
                <span style={{ background: 'rgba(0,0,0,0.6)', color: '#94a3b8', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', backdropFilter: 'blur(8px)' }}>
                  {listing.rent_or_sell === 'sell' ? '🏷 For Sale' : '🔄 For Rent'}
                </span>
              </div>
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', overflowX: 'auto' }}>
                {images.map((img, i) => (
                  <img key={i} src={img} alt="" onClick={() => setImgIdx(i)}
                    style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: i === imgIdx ? '2px solid #d4a0a0' : '2px solid transparent', opacity: i === imgIdx ? 1 : 0.6, transition: 'all 0.2s', flexShrink: 0 }} />
                ))}
              </div>
            )}
          </div>

          {/* Title & Price */}
          <div className="glass" style={{ borderRadius: '20px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '12px' }}>
              <h1 style={{ color: '#f1f5f9', fontSize: '22px', fontWeight: 700, lineHeight: 1.3 }}>{listing.title}</h1>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ color: '#d4a0a0', fontSize: '24px', fontWeight: 800 }}>{formatPrice(listing.price)}</div>
                <div style={{ color: '#475569', fontSize: '12px' }}>{listing.rent_or_sell === 'sell' ? 'Fixed Price' : `per ${listing.price_unit}`}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ color: '#475569', fontSize: '13px' }}>📍 {listing.location}</span>
              <span style={{ color: '#475569', fontSize: '13px' }}>👁 {listing.views || 0} views</span>
              <span style={{ color: '#475569', fontSize: '13px' }}>🕐 {timeAgo(listing.created_at)}</span>
              {listing.owner_rating && <span style={{ color: '#fbbf24', fontSize: '13px' }}>⭐ {listing.owner_rating}</span>}
            </div>
          </div>

          {/* Description */}
          <div className="glass" style={{ borderRadius: '20px', padding: '24px' }}>
            <h2 style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px' }}>Description</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.8 }}>{listing.description}</p>
          </div>

          {/* Specific Details */}
          <SpecificDetails listing={listing} />

          {/* Owner */}
          <div className="glass" style={{ borderRadius: '20px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg,#d4a0a0,#a77474)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: '#0f0a0a', flexShrink: 0 }}>
              {listing.owner_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '15px' }}>{listing.owner_name}</p>
              <p style={{ color: '#475569', fontSize: '12px', marginTop: '2px' }}>⭐ {listing.owner_rating || 'No ratings yet'} · Owner</p>
            </div>
            <a href={`tel:${listing.owner_phone}`} className="btn-primary" style={{ textDecoration: 'none', padding: '10px 20px', fontSize: '13px' }}>
              📞 Call
            </a>
          </div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <div>
              <h2 style={{ color: '#f1f5f9', fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
                Reviews <span style={{ color: '#475569', fontWeight: 400 }}>({reviews.length})</span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {reviews.map((r) => (
                  <div key={r.id} className="glass" style={{ borderRadius: '16px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '14px' }}>{r.reviewer_name}</span>
                      <span style={{ color: '#fbbf24', fontSize: '14px' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    </div>
                    <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.6 }}>{r.comment}</p>
                    <p style={{ color: '#334155', fontSize: '11px', marginTop: '8px' }}>{formatDate(r.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Booking Card ── */}
        <div style={{ position: 'sticky', top: '80px' }}>
          <div className="glass-strong" style={{ borderRadius: '24px', padding: '24px' }}>
            <h2 style={{ color: '#f1f5f9', fontSize: '17px', fontWeight: 700, marginBottom: '20px' }}>
              {listing.rent_or_sell === 'sell' ? '🏷 Buy Now' : '📅 Book Now'}
            </h2>

            {bookingSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }} className="animate-float">🎉</div>
                <p style={{ color: '#d4a0a0', fontWeight: 700, fontSize: '16px', marginBottom: '6px' }}>Request Sent!</p>
                <p style={{ color: '#475569', fontSize: '13px', marginBottom: '20px' }}>The owner will confirm shortly.</p>
                <button onClick={() => navigate('/my-bookings')} className="btn-primary" style={{ width: '100%' }}>
                  View My Bookings
                </button>
              </div>
            ) : (
              <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {listing.rent_or_sell !== 'sell' && (
                  <>
                    <div>
                      <label style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Start Date</label>
                      <input type="date" value={booking.start_date}
                        onChange={(e) => setBooking((b) => ({ ...b, start_date: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]} className="input-dark" />
                    </div>
                    <div>
                      <label style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>End Date</label>
                      <input type="date" value={booking.end_date}
                        onChange={(e) => setBooking((b) => ({ ...b, end_date: e.target.value }))}
                        min={booking.start_date || new Date().toISOString().split('T')[0]} className="input-dark" />
                    </div>
                  </>
                )}
                <div>
                  <label style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Quantity</label>
                  <input type="number" min={1} value={booking.quantity}
                    onChange={(e) => setBooking((b) => ({ ...b, quantity: parseInt(e.target.value) || 1 }))}
                    className="input-dark" />
                </div>
                <div>
                  <label style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Special Instructions</label>
                  <textarea value={booking.special_instructions}
                    onChange={(e) => setBooking((b) => ({ ...b, special_instructions: e.target.value }))}
                    rows={2} placeholder="Any special requirements..."
                    className="input-dark" style={{ resize: 'none' }} />
                </div>

                {bookingError && (
                  <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '10px 12px', color: '#f87171', fontSize: '12px' }}>
                    ⚠️ {bookingError}
                  </div>
                )}

                {/* Price breakdown */}
                <div style={{ background: 'rgba(167, 116, 116,0.04)', border: '1px solid rgba(167, 116, 116,0.1)', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>Price</span>
                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>{formatPrice(listing.price)}{listing.rent_or_sell !== 'sell' && `/${listing.price_unit}`}</span>
                  </div>
                  {booking.start_date && booking.end_date && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#64748b', fontSize: '13px' }}>Duration</span>
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>{days} day{days > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>Service (5%)</span>
                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>included</span>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', marginTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: 600 }}>Estimated Total</span>
                    <span style={{ color: '#d4a0a0', fontSize: '16px', fontWeight: 700 }}>{formatPrice(estimatedTotal)}</span>
                  </div>
                </div>

                <button type="submit" disabled={bookingLoading} className="btn-primary" style={{ width: '100%' }}>
                  {bookingLoading ? '⏳ Sending...' : listing.rent_or_sell === 'sell' ? 'Request to Buy' : 'Send Booking Request'}
                </button>

                {!user && (
                  <p style={{ color: '#334155', fontSize: '12px', textAlign: 'center' }}>
                    You need to <a href="/login" style={{ color: '#d4a0a0', textDecoration: 'none' }}>login</a> to book
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ color: '#475569', fontSize: '13px' }}>{label}</span>
      <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500, textTransform: 'capitalize' }}>{value}</span>
    </div>
  )
}

function SpecificDetails({ listing }) {
  const rows = []
  if (listing.type === 'equipment') {
    if (listing.manufacturer) rows.push(['Brand', listing.manufacturer])
    if (listing.equipment_model) rows.push(['Model', listing.equipment_model])
    if (listing.year) rows.push(['Year', listing.year])
    if (listing.horsepower) rows.push(['Horsepower', `${listing.horsepower} HP`])
    if (listing.fuel_type) rows.push(['Fuel', listing.fuel_type])
    if (listing.equipment_condition) rows.push(['Condition', listing.equipment_condition])
    if (listing.hours_used) rows.push(['Hours Used', listing.hours_used])
    if (listing.operator_included !== undefined) rows.push(['Operator', listing.operator_included ? '✅ Included' : '❌ Not included'])
    if (listing.delivery_available !== undefined) rows.push(['Delivery', listing.delivery_available ? '✅ Available' : '❌ Not available'])
  } else if (listing.type === 'land') {
    if (listing.area) rows.push(['Area', `${listing.area} acres`])
    if (listing.soil_type) rows.push(['Soil Type', listing.soil_type])
    if (listing.water_availability) rows.push(['Water', listing.water_availability])
    if (listing.irrigation_system) rows.push(['Irrigation', listing.irrigation_system])
    if (listing.road_access !== undefined) rows.push(['Road Access', listing.road_access ? '✅ Yes' : '❌ No'])
    if (listing.electricity_available !== undefined) rows.push(['Electricity', listing.electricity_available ? '✅ Yes' : '❌ No'])
    if (listing.current_crop) rows.push(['Current Crop', listing.current_crop])
  } else if (listing.type === 'livestock') {
    if (listing.animal_type) rows.push(['Animal', listing.animal_type])
    if (listing.breed) rows.push(['Breed', listing.breed])
    if (listing.age) rows.push(['Age', `${listing.age} months`])
    if (listing.gender) rows.push(['Gender', listing.gender])
    if (listing.weight) rows.push(['Weight', `${listing.weight} kg`])
    if (listing.milk_yield) rows.push(['Milk Yield', `${listing.milk_yield} L/day`])
    if (listing.health_status) rows.push(['Health', listing.health_status])
  } else if (listing.type === 'labor') {
    if (listing.experience) rows.push(['Experience', `${listing.experience} years`])
    if (listing.daily_rate) rows.push(['Daily Rate', formatPrice(listing.daily_rate)])
    if (listing.skills?.length) rows.push(['Skills', listing.skills.join(', ')])
    if (listing.languages?.length) rows.push(['Languages', listing.languages.join(', ')])
    if (listing.own_transport !== undefined) rows.push(['Transport', listing.own_transport ? '✅ Own vehicle' : '❌ No vehicle'])
    if (listing.distance_will_travel) rows.push(['Travel Range', `${listing.distance_will_travel} km`])
  }
  if (!rows.length) return null
  return (
    <div className="glass" style={{ borderRadius: '20px', padding: '24px' }}>
      <h2 style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Details</h2>
      {rows.map(([k, v]) => <DetailRow key={k} label={k} value={v} />)}
    </div>
  )
}


