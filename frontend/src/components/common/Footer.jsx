// src/components/common/Footer.jsx
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{ background: '#070c18', borderTop: '1px solid rgba(255,255,255,0.06)' }} className="mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{ background: 'linear-gradient(135deg,#d4a0a0,#a77474)', color: '#0f0a0a', boxShadow: '0 0 16px rgba(167, 116, 116,0.3)' }}>
                A
              </div>
              <span className="text-lg font-bold" style={{ color: '#f1f5f9' }}>
                Agri<span className="gradient-text">SmartX</span>
              </span>
            </div>
            <p style={{ color: '#475569', fontSize: '13px', lineHeight: '1.7' }}>
              India's most trusted agricultural marketplace. Connecting farmers, landowners & laborers since 2024.
            </p>
            <div className="flex gap-3 mt-5">
              {['𝕏', 'in', 'f'].map((s) => (
                <div key={s} className="w-8 h-8 rounded-lg flex items-center justify-center text-xs cursor-pointer transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}>
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h4 style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '13px', marginBottom: '16px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Marketplace
            </h4>
            <ul className="space-y-3">
              {[
                { to: '/listings?type=equipment', label: '🚜 Equipment' },
                { to: '/listings?type=land', label: '🌾 Land' },
                { to: '/listings?type=labor', label: '👨🌾 Labor' },
                { to: '/listings?type=livestock', label: '🐄 Livestock' },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} style={{ color: '#475569', fontSize: '13px', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#d4a0a0')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '13px', marginBottom: '16px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Account
            </h4>
            <ul className="space-y-3">
              {[
                { to: '/login', label: 'Login' },
                { to: '/signup', label: 'Sign Up' },
                { to: '/dashboard', label: 'Dashboard' },
                { to: '/my-bookings', label: 'My Bookings' },
                { to: '/create-listing', label: 'Post Listing' },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} style={{ color: '#475569', fontSize: '13px', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#d4a0a0')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '13px', marginBottom: '16px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Contact
            </h4>
            <ul className="space-y-3">
              {[
                { icon: '📧', text: 'support@agrismartx.com' },
                { icon: '📞', text: '1800-XXX-XXXX (Free)' },
                { icon: '📍', text: 'Pan India Coverage' },
              ].map((c) => (
                <li key={c.text} className="flex items-center gap-2" style={{ color: '#475569', fontSize: '13px' }}>
                  <span>{c.icon}</span> {c.text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="divider" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p style={{ color: '#334155', fontSize: '12px' }}>
            © {new Date().getFullYear()} AgriSmartX. All rights reserved.
          </p>
          <p style={{ color: '#334155', fontSize: '12px' }}>
            Made with <span className="gradient-text font-bold">❤</span> for Indian Farmers 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  )
}


