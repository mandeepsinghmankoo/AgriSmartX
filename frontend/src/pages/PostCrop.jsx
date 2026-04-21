// src/pages/PostCrop.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCropPost } from '../lib/cropSales'
import { uploadMultiple } from '../lib/storage'

const CROPS = [
  'Wheat', 'Maize', 'Rice', 'Brinjal', 'Potato', 'Tomato', 'Onion', 'Garlic',
  'Cabbage', 'Cauliflower', 'Spinach', 'Carrot', 'Radish', 'Peas', 'Soybean',
  'Sugarcane', 'Cotton', 'Groundnut', 'Sunflower', 'Mustard', 'Other',
]

const QUALITY = ['Premium', 'Grade A', 'Grade B', 'Standard']
const UNITS   = ['kg', 'quintal', 'ton', 'bag (50kg)']

const LABEL = { color: '#64748b', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }

function Field({ label, children }) {
  return <div><label style={LABEL}>{label}</label>{children}</div>
}

export default function PostCrop() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', crop_type: 'Wheat', quantity: '', unit: 'quintal',
    price_per_unit: '', quality: 'Grade A', harvest_date: '',
    location: '', state: '', description: '', is_negotiable: false,
  })
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(f => ({ ...f, [k]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title || !form.quantity || !form.price_per_unit || !form.location)
      return setError('Title, quantity, price and location are required')
    setLoading(true); setError('')
    try {
      let imageUrls = []
      if (images.length) imageUrls = await uploadMultiple(images)
      await createCropPost({
        ...form,
        quantity: parseFloat(form.quantity),
        price_per_unit: parseFloat(form.price_per_unit),
        images: imageUrls,
      })
      navigate('/crop-sales')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ color: '#86efac', fontSize: '12px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>BULK CROP SALE</p>
        <h1 style={{ color: '#f1f5f9', fontSize: '2rem', fontWeight: 700 }}>Post Your Crop</h1>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', color: '#f87171', fontSize: '13px' }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Basic */}
        <div className="glass" style={{ borderRadius: '20px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Crop Details</h2>

          <Field label="Post Title *">
            <input type="text" value={form.title} onChange={set('title')} required className="input-dark" placeholder="e.g. Fresh Wheat Harvest 2025" />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Field label="Crop Type *">
              <select value={form.crop_type} onChange={set('crop_type')} className="input-dark" style={{ cursor: 'pointer' }}>
                {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Quality Grade *">
              <select value={form.quality} onChange={set('quality')} className="input-dark" style={{ cursor: 'pointer' }}>
                {QUALITY.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </Field>
            <Field label="Quantity *">
              <input type="number" value={form.quantity} onChange={set('quantity')} min="1" required className="input-dark" placeholder="e.g. 500" />
            </Field>
            <Field label="Unit *">
              <select value={form.unit} onChange={set('unit')} className="input-dark" style={{ cursor: 'pointer' }}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </Field>
            <Field label="Price per Unit (₹) *">
              <input type="number" value={form.price_per_unit} onChange={set('price_per_unit')} min="0" required className="input-dark" placeholder="e.g. 2200" />
            </Field>
            <Field label="Expected Harvest Date">
              <input type="date" value={form.harvest_date} onChange={set('harvest_date')} className="input-dark" />
            </Field>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px 14px', background: form.is_negotiable ? 'rgba(134,239,172,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${form.is_negotiable ? 'rgba(134,239,172,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '10px' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0, background: form.is_negotiable ? 'linear-gradient(135deg,#86efac,#4ade80)' : 'rgba(255,255,255,0.06)', border: form.is_negotiable ? 'none' : '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {form.is_negotiable && <span style={{ color: '#0f0a0a', fontSize: '11px', fontWeight: 800 }}>✓</span>}
            </div>
            <input type="checkbox" checked={form.is_negotiable} onChange={set('is_negotiable')} style={{ display: 'none' }} />
            <span style={{ color: form.is_negotiable ? '#86efac' : '#64748b', fontSize: '13px', fontWeight: 500 }}>Price is Negotiable</span>
          </label>

          <Field label="Description">
            <textarea value={form.description} onChange={set('description')} rows={3} className="input-dark" style={{ resize: 'vertical' }} placeholder="Describe crop condition, storage, transport availability..." />
          </Field>
        </div>

        {/* Location */}
        <div className="glass" style={{ borderRadius: '20px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Location</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <Field label="Village / City *">
              <input type="text" value={form.location} onChange={set('location')} required className="input-dark" />
            </Field>
            <Field label="State">
              <input type="text" value={form.state} onChange={set('state')} className="input-dark" />
            </Field>
          </div>
        </div>

        {/* Photos */}
        <div className="glass" style={{ borderRadius: '20px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Photos</h2>
          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(134,239,172,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '28px', marginBottom: '8px' }}>📸</span>
            <span style={{ color: '#64748b', fontSize: '13px' }}>Upload crop photos</span>
            <input type="file" accept="image/*" multiple onChange={e => setImages(prev => [...prev, ...Array.from(e.target.files)])} style={{ display: 'none' }} />
          </label>
          {images.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {images.map((f, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={URL.createObjectURL(f)} alt="" style={{ width: '68px', height: '68px', objectFit: 'cover', borderRadius: '10px', border: '1px solid rgba(134,239,172,0.2)' }} />
                  <div onClick={() => setImages(imgs => imgs.filter((_, j) => j !== i))}
                    style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', background: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', cursor: 'pointer', color: 'white' }}>✕</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} className="btn-primary animate-pulse-glow"
          style={{ width: '100%', padding: '16px', fontSize: '16px', borderRadius: '16px', background: 'linear-gradient(135deg,#86efac,#4ade80)', color: '#0f172a' }}>
          {loading ? '⏳ Posting...' : '🌾 Post Crop for Sale'}
        </button>
      </form>
    </div>
  )
}
