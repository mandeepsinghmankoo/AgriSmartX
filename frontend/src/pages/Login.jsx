// src/pages/Login.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmail, signInWithPhone, verifyOTP } from '../lib/auth'

export default function Login() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('email')
  const [form, setForm] = useState({ email: '', password: '', phone: '', otp: '' })
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleEmail(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try { await signInWithEmail(form.email, form.password); navigate('/dashboard') }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function handleSendOtp(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try { await signInWithPhone('+91' + form.phone); setOtpSent(true) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try { await verifyOTP('+91' + form.phone, form.otp); navigate('/dashboard') }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      {/* Background glow */}
      <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(167, 116, 116,0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div className="animate-fade-up" style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg,#d4a0a0,#a77474)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 800, color: '#0f0a0a', margin: '0 auto 16px', boxShadow: '0 0 30px rgba(167, 116, 116,0.3)' }}>
            A
          </div>
          <h1 style={{ color: '#f1f5f9', fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>Welcome back</h1>
          <p style={{ color: '#475569', fontSize: '14px' }}>Sign in to your AgriSmartX account</p>
        </div>

        {/* Card */}
        <div className="glass-strong" style={{ borderRadius: '24px', padding: '32px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '4px', marginBottom: '28px' }}>
            {[{ id: 'email', label: '📧 Email' }, { id: 'phone', label: '📱 Phone OTP' }].map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setError(''); setOtpSent(false) }}
                style={{
                  flex: 1, padding: '9px', borderRadius: '9px', fontSize: '13px', fontWeight: 600,
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: tab === t.id ? 'linear-gradient(135deg,#d4a0a0,#a77474)' : 'transparent',
                  color: tab === t.id ? '#0f0a0a' : '#64748b',
                  boxShadow: tab === t.id ? '0 4px 12px rgba(167, 116, 116,0.25)' : 'none',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', color: '#f87171', fontSize: '13px' }}>
              ⚠️ {error}
            </div>
          )}

          {tab === 'email' ? (
            <form onSubmit={handleEmail} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ color: '#64748b', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Email</label>
                <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required className="input-dark" />
              </div>
              <div>
                <label style={{ color: '#64748b', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Password</label>
                <input type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required className="input-dark" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                {loading ? '⏳ Signing in...' : 'Sign In →'}
              </button>
            </form>
          ) : !otpSent ? (
            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ color: '#64748b', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Mobile Number</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 14px', color: '#64748b', fontSize: '14px', whiteSpace: 'nowrap' }}>
                    🇮🇳 +91
                  </div>
                  <input type="tel" placeholder="10-digit number" value={form.phone} onChange={set('phone')} required maxLength={10} className="input-dark" style={{ flex: 1 }} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                {loading ? '⏳ Sending OTP...' : 'Send OTP →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'rgba(167, 116, 116,0.06)', border: '1px solid rgba(167, 116, 116,0.15)', borderRadius: '10px', padding: '12px 14px', color: '#d4a0a0', fontSize: '13px' }}>
                ✅ OTP sent to +91 {form.phone}
              </div>
              <div>
                <label style={{ color: '#64748b', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Enter OTP</label>
                <input type="text" placeholder="• • • • • •" value={form.otp} onChange={set('otp')} required maxLength={6}
                  className="input-dark" style={{ textAlign: 'center', fontSize: '22px', letterSpacing: '12px', fontWeight: 700 }} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%' }}>
                {loading ? '⏳ Verifying...' : 'Verify & Login →'}
              </button>
              <button type="button" onClick={() => setOtpSent(false)} style={{ background: 'none', border: 'none', color: '#475569', fontSize: '13px', cursor: 'pointer', textAlign: 'center' }}>
                ← Change number
              </button>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ color: '#475569', fontSize: '13px' }}>Don't have an account? </span>
            <Link to="/signup" style={{ color: '#d4a0a0', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
              Sign Up Free
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}


