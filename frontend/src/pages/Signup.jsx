// src/pages/Signup.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp } from '../lib/auth'
import { validatePhone, validateEmail } from '../lib/utils'

const ROLES = [
  {
    id: 'farmer',
    icon: '🌾',
    label: 'Farmer',
    desc: 'Rent land, hire labor, buy/rent equipment & livestock',
    color: '#86efac',
    glow: 'rgba(134,239,172,0.12)',
  },
  {
    id: 'labor',
    icon: '👨🌾',
    label: 'Labor',
    desc: 'Find farm work, post your skills & get hired by farmers',
    color: '#fbbf24',
    glow: 'rgba(251,191,36,0.12)',
  },
  {
    id: 'asset_owner',
    icon: '🚜',
    label: 'Asset Owner',
    desc: 'Rent/sell tractors, harvesters, cattle, goats & machinery',
    color: '#60a5fa',
    glow: 'rgba(96,165,250,0.12)',
  },
  {
    id: 'dealer',
    icon: '🏪',
    label: 'Dealer / Seller',
    desc: 'Sell pesticides, seeds, fertilizers & agri products',
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.12)',
  },
  {
    id: 'buyer',
    icon: '🛍️',
    label: 'Buyer',
    desc: 'Shop seeds, fertilizers, pesticides, vet medicine & tools',
    color: '#34d399',
    glow: 'rgba(52,211,153,0.12)',
  },
]

const LABEL = { color: '#64748b', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }

export default function Signup() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1 = role select, 2 = form
  const [role, setRole] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const selectedRole = ROLES.find((r) => r.id === role)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!validateEmail(form.email)) return setError('Invalid email address')
    if (!validatePhone(form.phone)) return setError('Enter valid 10-digit Indian mobile number')
    if (form.password.length < 6) return setError('Password must be at least 6 characters')
    if (form.password !== form.confirm) return setError('Passwords do not match')
    setLoading(true)
    try {
      await signUp(form.email, form.password, form.name, form.phone, role)
      setSuccess(true)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  if (success) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="glass-strong animate-fade-up" style={{ borderRadius: '24px', padding: '48px 40px', textAlign: 'center', maxWidth: '420px', width: '100%' }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }} className="animate-float">🎉</div>
        <h2 style={{ color: '#f1f5f9', fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Account Created!</h2>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: selectedRole ? selectedRole.glow : 'rgba(167,116,116,0.1)', border: `1px solid ${selectedRole ? selectedRole.color + '30' : 'rgba(167,116,116,0.2)'}`, borderRadius: '20px', padding: '6px 14px', marginBottom: '16px' }}>
          <span>{selectedRole?.icon}</span>
          <span style={{ color: selectedRole?.color || '#d4a0a0', fontSize: '13px', fontWeight: 600 }}>{selectedRole?.label}</span>
        </div>
        <p style={{ color: '#475569', fontSize: '14px', marginBottom: '28px', lineHeight: 1.6 }}>
          Check your email to confirm your account, then sign in to your {selectedRole?.label} dashboard.
        </p>
        <Link to="/login" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', padding: '12px 32px' }}>
          Go to Login →
        </Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="animate-fade-up" style={{ width: '100%', maxWidth: step === 1 ? '680px' : '440px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg,#d4a0a0,#a77474)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 800, color: '#0f0a0a', margin: '0 auto 16px', boxShadow: '0 0 30px rgba(167,116,116,0.3)' }}>
            {step === 1 ? '🌱' : selectedRole?.icon}
          </div>
          <h1 style={{ color: '#f1f5f9', fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>
            {step === 1 ? 'Who are you?' : `Join as ${selectedRole?.label}`}
          </h1>
          <p style={{ color: '#475569', fontSize: '14px' }}>
            {step === 1 ? 'Choose your role to get a personalized experience' : 'Fill in your details to create your account'}
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '28px' }}>
          {[1, 2].map((s) => (
            <div key={s} style={{ width: s === step ? '24px' : '8px', height: '8px', borderRadius: '4px', background: s <= step ? 'linear-gradient(135deg,#d4a0a0,#a77474)' : 'rgba(255,255,255,0.1)', transition: 'all 0.3s' }} />
          ))}
        </div>

        {/* ── STEP 1: Role Selection ── */}
        {step === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            {ROLES.map((r) => (
              <button
                key={r.id}
                onClick={() => { setRole(r.id); setStep(2) }}
                style={{
                  padding: '20px 16px', borderRadius: '18px', cursor: 'pointer', textAlign: 'left',
                  border: `1px solid ${role === r.id ? r.color + '40' : 'rgba(255,255,255,0.07)'}`,
                  background: `radial-gradient(ellipse at top left, ${r.glow} 0%, rgba(17,24,39,0.9) 70%)`,
                  transition: 'all 0.25s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = r.color + '50'; e.currentTarget.style.boxShadow = `0 16px 32px rgba(0,0,0,0.4), 0 0 0 1px ${r.color}20` }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>{r.icon}</div>
                <div style={{ color: r.color, fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>{r.label}</div>
                <div style={{ color: '#475569', fontSize: '12px', lineHeight: 1.5 }}>{r.desc}</div>
              </button>
            ))}
          </div>
        )}

        {/* ── STEP 2: Registration Form ── */}
        {step === 2 && (
          <div className="glass-strong" style={{ borderRadius: '24px', padding: '32px' }}>
            {/* Selected role badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', padding: '12px 16px', background: selectedRole ? selectedRole.glow : 'rgba(167,116,116,0.08)', border: `1px solid ${selectedRole ? selectedRole.color + '30' : 'rgba(167,116,116,0.2)'}`, borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>{selectedRole?.icon}</span>
                <div>
                  <p style={{ color: selectedRole?.color || '#d4a0a0', fontWeight: 700, fontSize: '14px' }}>{selectedRole?.label}</p>
                  <p style={{ color: '#475569', fontSize: '11px' }}>{selectedRole?.desc}</p>
                </div>
              </div>
              <button onClick={() => setStep(1)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', borderRadius: '8px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}>
                Change
              </button>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', color: '#f87171', fontSize: '13px' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={LABEL}>Full Name</label>
                <input type="text" placeholder="Ramesh Kumar" value={form.name} onChange={set('name')} required className="input-dark" />
              </div>
              <div>
                <label style={LABEL}>Email</label>
                <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required className="input-dark" />
              </div>
              <div>
                <label style={LABEL}>Mobile Number</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 14px', color: '#64748b', fontSize: '14px', whiteSpace: 'nowrap' }}>
                    🇮🇳 +91
                  </div>
                  <input type="tel" placeholder="10-digit number" value={form.phone} onChange={set('phone')} required maxLength={10} className="input-dark" style={{ flex: 1 }} />
                </div>
              </div>
              <div>
                <label style={LABEL}>Password</label>
                <input type="password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} required className="input-dark" />
              </div>
              <div>
                <label style={LABEL}>Confirm Password</label>
                <input type="password" placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} required className="input-dark" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                {loading ? '⏳ Creating account...' : `Create ${selectedRole?.label} Account →`}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: '#475569', fontSize: '13px' }}>Already have an account? </span>
              <Link to="/login" style={{ color: '#d4a0a0', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
