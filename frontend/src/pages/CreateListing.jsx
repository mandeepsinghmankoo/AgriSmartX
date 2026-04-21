// src/pages/CreateListing.jsx
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createListing } from '../lib/listings'
import { uploadMultiple } from '../lib/storage'
import { useAuth } from '../contexts/AuthContext'

const PRICE_UNITS = {
  equipment: ['hour', 'day', 'month'],
  land: ['acre', 'month', 'season'],
  labor: ['hour', 'day', 'month'],
  livestock: ['fixed', 'month'],
  product: ['kg', 'litre', 'packet', 'piece', 'bag', 'box'],
}

// Which listing types each role is allowed to create
const ROLE_TYPES = {
  farmer:         ['equipment', 'land'],
  labor:          ['labor'],
  equipment_owner:['equipment', 'livestock'],
  dealer:         ['product'],
}

const PRODUCT_CATEGORIES = [
  { value: 'pesticide',   label: '🧪 Pesticides & Insecticides' },
  { value: 'fertilizer',  label: '🧴 Fertilizers & Manure' },
  { value: 'seed',        label: '🌱 Seeds & Saplings' },
  { value: 'animal_feed', label: '🌾 Animal Feed & Fodder' },
  { value: 'tool',        label: '🔧 Hand Tools & Equipment' },
  { value: 'irrigation',  label: '💧 Irrigation Supplies' },
  { value: 'organic',     label: '🌿 Organic Products' },
  { value: 'medicine',    label: '💊 Veterinary Medicine' },
  { value: 'other',       label: '📦 Other Agri Products' },
]

const TYPE_OPTIONS = [
  { value: 'equipment', label: 'Equipment', icon: '🚜', desc: 'Tractors, harvesters, tools' },
  { value: 'land',      label: 'Land',      icon: '🌾', desc: 'Farmland for lease or sale' },
  { value: 'labor',     label: 'Labor',     icon: '👨‍🌾', desc: 'Skilled farm workers' },
  { value: 'livestock', label: 'Livestock', icon: '🐄', desc: 'Cattle, goats, dairy animals' },
  { value: 'product',   label: 'Product',   icon: '📦', desc: 'Agri products & supplies' },
]

const LABEL = {
  color: '#64748b', fontSize: '11px', fontWeight: 600,
  letterSpacing: '0.5px', textTransform: 'uppercase',
  display: 'block', marginBottom: '8px',
}

// ── All sub-components defined OUTSIDE the main component ──

function Field({ label, children }) {
  return (
    <div>
      <label style={LABEL}>{label}</label>
      {children}
    </div>
  )
}

function Input({ label, ...props }) {
  return (
    <div>
      <label style={LABEL}>{label}</label>
      <input {...props} className="input-dark" />
    </div>
  )
}

function SelectField({ label, value, onChange, children }) {
  return (
    <div>
      <label style={LABEL}>{label}</label>
      <select value={value} onChange={onChange} className="input-dark" style={{ cursor: 'pointer' }}>
        {children}
      </select>
    </div>
  )
}

function Checkbox({ label, checked, onChange }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
      padding: '10px 14px',
      background: checked ? 'rgba(167,116,116,0.06)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${checked ? 'rgba(167,116,116,0.2)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: '10px', transition: 'all 0.2s',
    }}>
      <div style={{
        width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0,
        background: checked ? 'linear-gradient(135deg,#d4a0a0,#a77474)' : 'rgba(255,255,255,0.06)',
        border: checked ? 'none' : '1px solid rgba(255,255,255,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
      }}>
        {checked && <span style={{ color: '#0f0a0a', fontSize: '11px', fontWeight: 800 }}>✓</span>}
      </div>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ display: 'none' }} />
      <span style={{ color: checked ? '#f1f5f9' : '#64748b', fontSize: '13px', fontWeight: 500 }}>{label}</span>
    </label>
  )
}

function Section({ title, children }) {
  return (
    <div className="glass" style={{ borderRadius: '20px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <h2 style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

function Grid({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
      {children}
    </div>
  )
}

// ── Camera Modal ──
function CameraModal({ onCapture, onClose }) {
  const videoRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then((s) => { setStream(s); videoRef.current.srcObject = s })
      .catch(() => setError('Camera access denied or not available.'))
    return () => stream?.getTracks().forEach((t) => t.stop())
  }, [])

  function capture() {
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
    canvas.toBlob((blob) => {
      const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' })
      stream?.getTracks().forEach((t) => t.stop())
      onCapture(file)
    }, 'image/jpeg', 0.92)
  }

  function close() {
    stream?.getTracks().forEach((t) => t.stop())
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#0f172a', borderRadius: '20px', padding: '20px', width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {error ? (
          <p style={{ color: '#f87171', textAlign: 'center', padding: '20px' }}>{error}</p>
        ) : (
          <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '12px', background: '#000' }} />
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={close}
            style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', fontWeight: 600 }}>
            Cancel
          </button>
          {!error && (
            <button type="button" onClick={capture} className="btn-primary"
              style={{ flex: 2, padding: '12px', borderRadius: '12px', fontSize: '15px' }}>
              📸 Capture
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main component ──

export default function CreateListing() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const allowedTypes = ROLE_TYPES[role] || ['equipment']
  const isLabor = role === 'labor'
  const isSingleType = allowedTypes.length === 1
  const defaultType = allowedTypes[0]
  const [form, setForm] = useState({
    type: defaultType, title: '', description: '',
    price: '', price_unit: PRICE_UNITS[defaultType][0], rent_or_sell: 'rent',
    location: '', state: '', pincode: '',
    category: '', status: 'active',
    manufacturer: '', equipment_model: '', year: '', horsepower: '', fuel_type: '',
    equipment_condition: 'good', hours_used: '', operator_included: false, delivery_available: false,
    area: '', soil_type: '', water_availability: '', irrigation_system: '',
    road_access: false, electricity_available: false, current_crop: '',
    animal_type: '', breed: '', age: '', gender: '', weight: '', milk_yield: '', health_status: 'healthy',
    experience: '', daily_rate: '', hourly_rate: '', skills: '', languages: '',
    own_transport: false, distance_will_travel: '',
    brand: '', quantity: '', quantity_unit: '', expiry_date: '', stock_available: '',
  })
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCamera, setShowCamera] = useState(false)

  const set = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [k]: val }))
  }

  function setType(value) {
    setForm((f) => ({ ...f, type: value, price_unit: f.rent_or_sell === 'sell' ? 'fixed' : PRICE_UNITS[value][0] }))
  }

  function setRentOrSell(value) {
    setForm((f) => ({ ...f, rent_or_sell: value, price_unit: value === 'sell' ? 'fixed' : PRICE_UNITS[f.type][0] }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (isLabor) {
      if (!form.title || !form.daily_rate) return setError('Title and Daily Rate are required')
    } else {
      if (!form.title || !form.price || !form.location) return setError('Title, price and location are required')
    }
    setLoading(true); setError('')
    try {
      let imageUrls = []
      if (images.length) imageUrls = await uploadMultiple(images)
      const payload = { ...form, images: imageUrls, price: parseFloat(isLabor ? form.daily_rate : form.price) }
      ;['year', 'horsepower', 'hours_used', 'area', 'age', 'weight', 'milk_yield',
        'experience', 'daily_rate', 'hourly_rate', 'distance_will_travel'].forEach((k) => {
        if (payload[k]) payload[k] = parseFloat(payload[k])
      })
      if (isLabor) {
        payload.location    = payload.location    || 'Not specified'
        payload.price_unit  = payload.price_unit  || 'day'
        payload.rent_or_sell = payload.rent_or_sell || 'rent'
      }
      if (form.skills)    payload.skills    = form.skills.split(',').map((s) => s.trim()).filter(Boolean)
      if (form.languages) payload.languages = form.languages.split(',').map((s) => s.trim()).filter(Boolean)
      const listing = await createListing(payload)
      navigate(`/listings/${listing.listing_id}`)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <p style={{ color: '#d4a0a0', fontSize: '12px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>NEW LISTING</p>
        <h1 style={{ color: '#f1f5f9', fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.3px' }}>Create Listing</h1>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '14px 16px', marginBottom: '24px', color: '#f87171', fontSize: '13px' }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── Type Selector (only for dealer who has multiple types) ── */}
        {!isSingleType && <Section title="Listing Type">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {TYPE_OPTIONS.filter(t => allowedTypes.includes(t.value)).map((t) => (
              <button key={t.value} type="button" onClick={() => setType(t.value)}
                style={{
                  padding: '16px', borderRadius: '14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                  border: `1px solid ${form.type === t.value ? 'rgba(167,116,116,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  background: form.type === t.value ? 'rgba(167,116,116,0.08)' : 'rgba(255,255,255,0.03)',
                }}>
                <div style={{ fontSize: '24px', marginBottom: '6px' }}>{t.icon}</div>
                <div style={{ color: form.type === t.value ? '#d4a0a0' : '#f1f5f9', fontWeight: 600, fontSize: '14px' }}>{t.label}</div>
                <div style={{ color: '#475569', fontSize: '12px', marginTop: '2px' }}>{t.desc}</div>
              </button>
            ))}
          </div>
          <Grid>
            <SelectField label="Rent or Sell" value={form.rent_or_sell} onChange={e => setRentOrSell(e.target.value)}>
              <option value="rent">🔄 Rent / Lease</option>
              <option value="sell">🏷 Sell</option>
            </SelectField>
            <SelectField label="Category" value={form.category} onChange={set('category')}>
              <option value="">General</option>
              {form.type === 'equipment' && <>
                <option value="tractor">Tractor</option>
                <option value="harvester">Harvester</option>
                <option value="pump">Water Pump</option>
                <option value="sprayer">Sprayer</option>
              </>}
              {form.type === 'land' && <>
                <option value="agricultural">Agricultural</option>
                <option value="orchard">Orchard</option>
                <option value="greenhouse">Greenhouse</option>
              </>}
              {form.type === 'livestock' && <>
                <option value="dairy">Dairy</option>
                <option value="draught">Draught</option>
                <option value="breeding">Breeding</option>
              </>}
            </SelectField>
          </Grid>
        </Section>}

        {/* Category for single-type roles */}
        {isSingleType && !isLabor && (
          <Section title={role === 'dealer' ? 'Product Category' : 'Category'}>
            <Grid>
              {role !== 'dealer' && (
                <SelectField label="Rent or Sell" value={form.rent_or_sell} onChange={e => setRentOrSell(e.target.value)}>
                  <option value="rent">🔄 Rent / Lease</option>
                  <option value="sell">🏷 Sell</option>
                </SelectField>
              )}
              <SelectField label="Category" value={form.category} onChange={set('category')}>
                <option value="">Select Category</option>
                {role === 'dealer'
                  ? PRODUCT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)
                  : form.type === 'equipment'
                    ? <>
                        <option value="tractor">Tractor</option>
                        <option value="harvester">Harvester</option>
                        <option value="pump">Water Pump</option>
                        <option value="sprayer">Sprayer</option>
                      </>
                    : <>
                        <option value="dairy">Dairy</option>
                        <option value="draught">Draught</option>
                        <option value="breeding">Breeding</option>
                      </>
                }
              </SelectField>
            </Grid>
          </Section>
        )}

        {/* ── Basic Info ── */}
        <Section title="Basic Information">
          <Field label="Title *">
            <input type="text" value={form.title} onChange={set('title')} required className="input-dark" />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={set('description')} rows={3}
              className="input-dark" style={{ resize: 'vertical' }} />
          </Field>
          {!isLabor && (
            <Grid>
              <Field label="Price *">
                <input type="number" value={form.price} onChange={set('price')} min="0" required className="input-dark" />
              </Field>
              {form.rent_or_sell === 'sell' ? (
                <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderRadius: '10px', background: 'rgba(134,239,172,0.06)', border: '1px solid rgba(134,239,172,0.15)' }}>
                  <span style={{ color: '#86efac', fontSize: '12px', fontWeight: 600 }}>🏷 Fixed Sale Price</span>
                </div>
              ) : (
                <SelectField label="Price Unit *" value={form.price_unit} onChange={set('price_unit')}>
                  {(PRICE_UNITS[form.type] || ['day']).map((u) => <option key={u} value={u}>{u}</option>)}
                </SelectField>
              )}
            </Grid>
          )}
        </Section>

        {/* ── Location (non-labor only) ── */}
        {!isLabor && (
          <Section title="Location">
            <Grid>
              <Input label="Village / City *" type="text" value={form.location} onChange={set('location')} required />
              <Input label="State" type="text" value={form.state} onChange={set('state')} />
              <Input label="Pincode" type="text" value={form.pincode} onChange={set('pincode')} maxLength={6} />
            </Grid>
          </Section>
        )}

        {/* ── Equipment ── */}
        {form.type === 'equipment' && (
          <Section title="Equipment Details">
            <Grid>
              <Input label="Brand / Manufacturer" type="text" value={form.manufacturer} onChange={set('manufacturer')} />
              <Input label="Model" type="text" value={form.equipment_model} onChange={set('equipment_model')} />
              <Input label="Year" type="number" value={form.year} onChange={set('year')} />
              <Input label="Horsepower (HP)" type="number" value={form.horsepower} onChange={set('horsepower')} />
              <SelectField label="Fuel Type" value={form.fuel_type} onChange={set('fuel_type')}>
                <option value="">Select</option>
                <option value="diesel">Diesel</option>
                <option value="petrol">Petrol</option>
                <option value="electric">Electric</option>
              </SelectField>
              <SelectField label="Condition" value={form.equipment_condition} onChange={set('equipment_condition')}>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="needs_repair">Needs Repair</option>
              </SelectField>
              <Input label="Hours Used" type="number" value={form.hours_used} onChange={set('hours_used')} />
            </Grid>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Checkbox label="Operator Included" checked={form.operator_included} onChange={set('operator_included')} />
              <Checkbox label="Delivery Available" checked={form.delivery_available} onChange={set('delivery_available')} />
            </div>
          </Section>
        )}

        {/* ── Land ── */}
        {form.type === 'land' && (
          <Section title="Land Details">
            <Grid>
              <Input label="Area (acres)" type="number" value={form.area} onChange={set('area')} />
              <SelectField label="Soil Type" value={form.soil_type} onChange={set('soil_type')}>
                <option value="">Select</option>
                <option value="black">Black</option>
                <option value="red">Red</option>
                <option value="loamy">Loamy</option>
                <option value="sandy">Sandy</option>
                <option value="clay">Clay</option>
              </SelectField>
              <SelectField label="Water Availability" value={form.water_availability} onChange={set('water_availability')}>
                <option value="">Select</option>
                <option value="well">Well</option>
                <option value="borewell">Borewell</option>
                <option value="canal">Canal</option>
                <option value="rainfed">Rainfed</option>
              </SelectField>
              <SelectField label="Irrigation System" value={form.irrigation_system} onChange={set('irrigation_system')}>
                <option value="">Select</option>
                <option value="drip">Drip</option>
                <option value="sprinkler">Sprinkler</option>
                <option value="flood">Flood</option>
              </SelectField>
              <Input label="Current Crop" type="text" value={form.current_crop} onChange={set('current_crop')} />
            </Grid>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Checkbox label="Road Access" checked={form.road_access} onChange={set('road_access')} />
              <Checkbox label="Electricity Available" checked={form.electricity_available} onChange={set('electricity_available')} />
            </div>
          </Section>
        )}

        {/* ── Livestock ── */}
        {form.type === 'livestock' && (
          <Section title="Livestock Details">
            <Grid>
              <SelectField label="Animal Type" value={form.animal_type} onChange={set('animal_type')}>
                <option value="">Select</option>
                <option value="cow">Cow</option>
                <option value="buffalo">Buffalo</option>
                <option value="goat">Goat</option>
                <option value="ox">Ox</option>
                <option value="sheep">Sheep</option>
              </SelectField>
              <Input label="Breed" type="text" value={form.breed} onChange={set('breed')} />
              <Input label="Age (months)" type="number" value={form.age} onChange={set('age')} />
              <SelectField label="Gender" value={form.gender} onChange={set('gender')}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </SelectField>
              <Input label="Weight (kg)" type="number" value={form.weight} onChange={set('weight')} />
              <Input label="Milk Yield (L/day)" type="number" value={form.milk_yield} onChange={set('milk_yield')} />
              <SelectField label="Health Status" value={form.health_status} onChange={set('health_status')}>
                <option value="healthy">Healthy</option>
                <option value="pregnant">Pregnant</option>
                <option value="lactating">Lactating</option>
                <option value="needs_vet">Needs Vet</option>
              </SelectField>
            </Grid>
          </Section>
        )}

        {/* ── Product (Seller) ── */}
        {form.type === 'product' && (
          <Section title="Product Details">
            <Grid>
              <Input label="Brand / Manufacturer" type="text" value={form.brand} onChange={set('brand')} />
              <Input label="Stock Available" type="number" value={form.stock_available} onChange={set('stock_available')} />
              <Input label="Quantity per Unit" type="number" value={form.quantity} onChange={set('quantity')} />
              <SelectField label="Quantity Unit" value={form.quantity_unit} onChange={set('quantity_unit')}>
                <option value="">Select</option>
                <option value="kg">kg</option>
                <option value="gram">gram</option>
                <option value="litre">litre</option>
                <option value="ml">ml</option>
                <option value="packet">packet</option>
                <option value="bag">bag (50kg)</option>
                <option value="box">box</option>
                <option value="piece">piece</option>
              </SelectField>
              <Input label="Expiry Date" type="date" value={form.expiry_date} onChange={set('expiry_date')} />
            </Grid>
          </Section>
        )}

        {/* ── Labor ── */}
        {form.type === 'labor' && (
          <Section title="Labor Details">
            <Grid>
              <Input label="Experience (years)" type="number" value={form.experience} onChange={set('experience')} />
              <Input label="Daily Rate (₹) *" type="number" value={form.daily_rate} onChange={set('daily_rate')} />
              {!isLabor && (
                <>
                  <Input label="Hourly Rate (₹)" type="number" value={form.hourly_rate} onChange={set('hourly_rate')} />
                  <Input label="Travel Range (km)" type="number" value={form.distance_will_travel} onChange={set('distance_will_travel')} />
                </>
              )}
            </Grid>
            <Field label="Skills (comma separated)">
              <input type="text" value={form.skills} onChange={set('skills')} className="input-dark" />
            </Field>
            <Field label="Languages (comma separated)">
              <input type="text" value={form.languages} onChange={set('languages')} className="input-dark" />
            </Field>
            <Checkbox label="Own Transport / Vehicle" checked={form.own_transport} onChange={set('own_transport')} />
          </Section>
        )}

        {/* ── Photos ── */}
        <Section title="Photos">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
            <label
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '32px', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px',
                cursor: 'pointer', transition: 'all 0.2s', background: 'rgba(255,255,255,0.02)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(167,116,116,0.3)'; e.currentTarget.style.background = 'rgba(167,116,116,0.03)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
            >
              <span style={{ fontSize: '32px', marginBottom: '8px' }}>📸</span>
              <span style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Click to upload photos</span>
              <span style={{ color: '#334155', fontSize: '12px', marginTop: '4px' }}>PNG, JPG up to 10MB each</span>
              <input type="file" accept="image/*" multiple onChange={(e) => setImages(prev => [...prev, ...Array.from(e.target.files)])} style={{ display: 'none' }} />
            </label>
            <button type="button" onClick={() => setShowCamera(true)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '20px 24px', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px',
                cursor: 'pointer', transition: 'all 0.2s', background: 'rgba(255,255,255,0.02)', gap: '8px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(96,165,250,0.4)'; e.currentTarget.style.background = 'rgba(96,165,250,0.05)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
            >
              <span style={{ fontSize: '28px' }}>📷</span>
              <span style={{ color: '#60a5fa', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>Camera</span>
            </button>
            {showCamera && (
              <CameraModal
                onCapture={(file) => { setImages((prev) => [...prev, file]); setShowCamera(false) }}
                onClose={() => setShowCamera(false)}
              />
            )}
          </div>
          {images.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {images.map((f, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={URL.createObjectURL(f)} alt="" style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '10px', border: '1px solid rgba(167,116,116,0.2)' }} />
                  <div
                    style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', background: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', cursor: 'pointer', color: 'white' }}
                    onClick={() => setImages((imgs) => imgs.filter((_, j) => j !== i))}
                  >✕</div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <button type="submit" disabled={loading} className="btn-primary animate-pulse-glow"
          style={{ width: '100%', padding: '16px', fontSize: '16px', borderRadius: '16px' }}>
          {loading ? '⏳ Publishing...' : '🚀 Publish Listing'}
        </button>
      </form>
    </div>
  )
}
