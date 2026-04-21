// src/components/common/Navbar.jsx
import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { isAgriRole } from '../../lib/roles'

const ROLE_NAV = {
  farmer: [
    { to: '/listings',       label: 'Browse' },
    { to: '/create-listing', label: '+ List' },
    { to: '/my-bookings',    label: 'Bookings' },
    { to: '/dashboard',      label: 'Dashboard' },
  ],
  labor: [
    { to: '/listings?type=labor', label: 'Find Work' },
    { to: '/create-listing',      label: '+ List Yourself' },
    { to: '/dashboard',           label: 'Dashboard' },
  ],
  asset_owner: [
    { to: '/listings',       label: 'Browse' },
    { to: '/create-listing', label: '+ Add Asset' },
    { to: '/my-bookings',    label: 'Requests' },
    { to: '/dashboard',      label: 'Dashboard' },
  ],
  dealer: [
    { to: '/listings',       label: 'Browse' },
    { to: '/create-listing', label: '+ Add Listing' },
    { to: '/my-bookings',    label: 'Bookings' },
    { to: '/dashboard',      label: 'Dashboard' },
  ],
  buyer: [
    { to: '/marketplace',    label: '🛍️ Shop' },
    { to: '/dashboard',      label: 'Dashboard' },
  ],
  // legacy aliases
  equipment_owner: [
    { to: '/listings',       label: 'Browse' },
    { to: '/create-listing', label: '+ Add Asset' },
    { to: '/my-bookings',    label: 'Requests' },
    { to: '/dashboard',      label: 'Dashboard' },
  ],
  livestock_owner: [
    { to: '/listings',       label: 'Browse' },
    { to: '/create-listing', label: '+ Add Asset' },
    { to: '/my-bookings',    label: 'Requests' },
    { to: '/dashboard',      label: 'Dashboard' },
  ],
}

export default function Navbar() {
  const { user, role, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const location = useLocation()

  async function handleSignOut() {
    setSigningOut(true)
    try { await signOut() } catch { window.location.href = '/login' }
    setSigningOut(false)
  }

  useEffect(() => {
    setOpen(false)
  }, [location])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = user
    ? (ROLE_NAV[role] || ROLE_NAV.farmer)
    : [{ to: '/listings', label: 'Explore' }]

  return (
    <nav
      style={{
        background: scrolled
          ? 'rgba(15, 10, 10, 0.95)'
          : 'rgba(15, 10, 10, 0.7)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: scrolled
          ? '1px solid rgba(167, 116, 116, 0.1)'
          : '1px solid rgba(255,255,255,0.05)',
        transition: 'all 0.3s ease',
      }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img className='w-60' src="./../../../public/LOGO.png" alt="" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                style={({ isActive }) => ({
                  color: isActive ? '#d4a0a0' : '#94a3b8',
                  background: isActive ? 'rgba(167, 116, 116,0.08)' : 'transparent',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  textDecoration: 'none',
                })}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.style.background.includes('0.08')) {
                    e.currentTarget.style.color = '#f1f5f9'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  }
                }}
                onMouseLeave={(e) => {
                  const isActive = e.currentTarget.getAttribute('aria-current') === 'page'
                  e.currentTarget.style.color = isActive ? '#d4a0a0' : '#94a3b8'
                  e.currentTarget.style.background = isActive ? 'rgba(167, 116, 116,0.08)' : 'transparent'
                }}
              >
                {l.label}
              </NavLink>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#f1f5f9',
                    fontSize: '13px',
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg,#d4a0a0,#a77474)', color: '#0f0a0a' }}
                  >
                    {(user.user_metadata?.name || 'U')[0].toUpperCase()}
                  </div>
                  {user.user_metadata?.name?.split(' ')[0] || 'Profile'}
                </Link>
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="btn-ghost"
                  style={{ padding: '6px 14px', fontSize: '13px', opacity: signingOut ? 0.6 : 1 }}
                >
                  {signingOut ? '...' : 'Logout'}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  style={{
                    color: '#94a3b8',
                    fontSize: '14px',
                    fontWeight: 500,
                    padding: '6px 14px',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#f1f5f9')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                  Login
                </Link>
                <Link to="/signup" className="btn-primary" style={{ padding: '8px 20px', fontSize: '13px', textDecoration: 'none' }}>
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-all"
            style={{
              background: open ? 'rgba(167, 116, 116,0.1)' : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#f1f5f9',
            }}
          >
            {open ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div
            className="md:hidden pb-4 pt-2 animate-fade-down"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex flex-col gap-1 mt-2">
              {navLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  style={{
                    color: '#94a3b8',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 500,
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {l.label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link to="/profile" style={{ color: '#94a3b8', padding: '10px 12px', borderRadius: '10px', fontSize: '14px', textDecoration: 'none' }}>
                    Profile
                  </Link>
                  <button onClick={handleSignOut} disabled={signingOut} style={{ color: '#f87171', padding: '10px 12px', textAlign: 'left', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}>
                    {signingOut ? 'Signing out...' : 'Logout'}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" style={{ color: '#94a3b8', padding: '10px 12px', borderRadius: '10px', fontSize: '14px', textDecoration: 'none' }}>Login</Link>
                  <Link to="/signup" className="btn-primary" style={{ textAlign: 'center', textDecoration: 'none', marginTop: '8px' }}>Get Started</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}


