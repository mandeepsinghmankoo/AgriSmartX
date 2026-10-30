// src/components/common/Navbar.jsx
import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useUnreadCount } from '../../lib/useUnreadCount'
import { getNotifications, markAllRead, markRead } from '../../lib/notifications'
import { timeAgo } from '../../lib/utils'
import { supabase } from '../../lib/supabase'

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
    { to: '/orders',         label: 'Product Orders' },
    { to: '/my-bookings',    label: 'Bookings' },
    { to: '/dashboard',      label: 'Dashboard' },
  ],
  buyer: [
    { to: '/marketplace', label: '🛍️ Shop' },
    { to: '/orders',      label: '📦 Orders' },
    { to: '/dashboard',   label: 'Dashboard' },
  ],
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

const HELP_URL = 'https://agrismartx-voice-assist.vercel.app/'

export default function Navbar() {
  const { user, role, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState('')
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notificationError, setNotificationError] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const unread = useUnreadCount()

  async function handleSignOut() {
    setSigningOut(true)
    setSignOutError('')
    try {
      await signOut()
    } catch (error) {
      setSignOutError(error.message || 'Could not sign out. Please try again.')
    } finally {
      setSigningOut(false)
    }
  }

  useEffect(() => {
    setOpen(false)
    setNotificationOpen(false)
  }, [location])

  useEffect(() => {
    setNotifications([])
    setNotificationError('')
    if (!user) return undefined

    let active = true
    getNotifications()
      .then(items => { if (active) setNotifications(items) })
      .catch(error => { if (active) setNotificationError(error.message || 'Could not load notifications.') })

    const channel = supabase
      .channel(`navbar_notifications_${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        setNotifications(items => [payload.new, ...items.filter(item => item.id !== payload.new.id)].slice(0, 50))
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        setNotifications(items => items.map(item => item.id === payload.new.id ? payload.new : item))
      })
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [user])

  async function handleNotificationClick(notification) {
    setNotificationError('')
    try {
      if (!notification.is_read) await markRead(notification.id)
      setNotifications(items => items.map(item =>
        item.id === notification.id ? { ...item, is_read: true } : item
      ))
      setNotificationOpen(false)
      const data = notification.data || {}
      if (data.booking_id) {
        navigate(`/chat?booking_id=${encodeURIComponent(data.booking_id)}`)
      } else if (data.chat_id) {
        navigate(`/chat?chat_id=${encodeURIComponent(data.chat_id)}`)
      } else {
        navigate('/dashboard')
      }
    } catch (error) {
      setNotificationError(error.message || 'Could not open notification.')
    }
  }

  async function handleMarkAllNotificationsRead() {
    setNotificationError('')
    try {
      await markAllRead()
      setNotifications(items => items.map(item => ({ ...item, is_read: true })))
    } catch (error) {
      setNotificationError(error.message || 'Could not mark notifications as read.')
    }
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = user ? (ROLE_NAV[role] || ROLE_NAV.farmer) : [{ to: '/listings', label: 'Explore' }]

  return (
    <nav
      style={{
        background: scrolled ? 'rgba(15,10,10,0.95)' : 'rgba(15,10,10,0.7)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: scrolled ? '1px solid rgba(167,116,116,0.1)' : '1px solid rgba(255,255,255,0.05)',
        transition: 'all 0.3s ease',
      }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img className="w-60" src="/LOGO.png" alt="AgriSmartX" />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                style={({ isActive }) => ({
                  color: isActive ? '#d4a0a0' : '#94a3b8',
                  background: isActive ? 'rgba(167,116,116,0.08)' : 'transparent',
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
                  const active = e.currentTarget.getAttribute('aria-current') === 'page'
                  e.currentTarget.style.color = active ? '#d4a0a0' : '#94a3b8'
                  e.currentTarget.style.background = active ? 'rgba(167,116,116,0.08)' : 'transparent'
                }}
              >
                {l.label}
              </NavLink>
            ))}
          </div>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {/* Notification Bell */}
                <button
                  type="button"
                  title="Notifications"
                  aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
                  aria-expanded={notificationOpen}
                  onClick={() => setNotificationOpen(value => !value)}
                  style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '12px', background: notificationOpen ? 'rgba(234,170,0,0.12)' : 'rgba(221,227,232,0.08)', border: '1px solid rgba(221,227,232,0.18)', color: notificationOpen ? '#EAAA00' : '#e3dce6', fontSize: '17px', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  🔔
                  {unread > 0 && (
                    <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'linear-gradient(135deg,#ffd04a,#EAAA00)', color: '#211523', borderRadius: '999px', minWidth: '18px', height: '18px', padding: '0 4px', fontSize: '9px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #160f19' }}>
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>

                {/* Profile */}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9', fontSize: '13px', fontWeight: 500, textDecoration: 'none' }}
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg,#d4a0a0,#a77474)', color: '#0f0a0a' }}>
                    {(user.user_metadata?.name || 'U')[0].toUpperCase()}
                  </div>
                  {user.user_metadata?.name?.split(' ')[0] || 'Profile'}
                </Link>

                {/* Logout */}
                <button onClick={handleSignOut} disabled={signingOut} className="btn-ghost" style={{ padding: '6px 14px', fontSize: '13px', opacity: signingOut ? 0.6 : 1 }}>
                  {signingOut ? '...' : 'Logout'}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 500, padding: '6px 14px', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#f1f5f9')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                >
                  Login
                </Link>
                <Link to="/signup" className="btn-primary" style={{ padding: '8px 20px', fontSize: '13px', textDecoration: 'none' }}>
                  Get Started
                </Link>
              </>
            )}

            {/* Help — always visible, rightmost */}
            <a
              href={HELP_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: '6px 14px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', background: 'linear-gradient(135deg,#60a5fa,#3b82f6)', color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}
            >
              🎧 Help
            </a>
          </div>

          {/* Mobile toggle */}
          {user && (
            <button
              type="button"
              title="Notifications"
              aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
              aria-expanded={notificationOpen}
              onClick={() => setNotificationOpen(value => !value)}
              className="md:hidden relative w-9 h-9 flex items-center justify-center rounded-lg"
              style={{ background: 'rgba(221,227,232,0.08)', border: '1px solid rgba(221,227,232,0.18)', color: '#e3dce6' }}
            >
              🔔
              {unread > 0 && <span style={{ position: 'absolute', top: '-5px', right: '-5px', minWidth: '17px', height: '17px', padding: '0 3px', borderRadius: '999px', background: '#EAAA00', color: '#211523', fontSize: '9px', fontWeight: 800, display: 'grid', placeItems: 'center' }}>{unread > 9 ? '9+' : unread}</span>}
            </button>
          )}
          <button
            onClick={() => setOpen(o => !o)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-all"
            style={{ background: open ? 'rgba(167,116,116,0.1)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9' }}
          >
            {open ? '✕' : '☰'}
          </button>
        </div>

        {user && notificationOpen && (
          <section
            aria-label="Notifications"
            style={{ position: 'absolute', zIndex: 100, top: '64px', right: '16px', width: 'min(390px, calc(100vw - 32px))', maxHeight: 'min(70vh, 560px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '18px', background: 'rgba(24,16,27,0.94)', border: '1px solid rgba(221,227,232,0.2)', boxShadow: '0 24px 70px rgba(0,0,0,0.55), inset 0 1px 0 rgba(221,227,232,0.12)', backdropFilter: 'blur(28px) saturate(155%)', WebkitBackdropFilter: 'blur(28px) saturate(155%)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', borderBottom: '1px solid rgba(221,227,232,0.12)' }}>
              <div>
                <strong style={{ color: '#f3eff4', fontSize: '15px' }}>Notifications</strong>
                <div style={{ color: '#aa9bab', fontSize: '11px', marginTop: '3px' }}>{unread ? `${unread} unread` : 'You’re all caught up'}</div>
              </div>
              {unread > 0 && (
                <button type="button" onClick={handleMarkAllNotificationsRead} style={{ border: 0, background: 'transparent', color: '#EAAA00', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>
                  Mark all read
                </button>
              )}
            </div>
            {notificationError && <p role="alert" style={{ color: '#fca5a5', fontSize: '12px', padding: '10px 16px', margin: 0 }}>{notificationError}</p>}
            <div style={{ overflowY: 'auto', padding: '8px' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '30px 16px', textAlign: 'center', color: '#aa9bab', fontSize: '13px' }}>No notifications yet.</div>
              ) : notifications.map(notification => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  style={{ display: 'flex', width: '100%', gap: '11px', alignItems: 'flex-start', textAlign: 'left', padding: '12px', margin: '2px 0', borderRadius: '12px', border: `1px solid ${notification.is_read ? 'transparent' : 'rgba(234,170,0,0.2)'}`, background: notification.is_read ? 'transparent' : 'rgba(234,170,0,0.07)', cursor: 'pointer' }}
                >
                  <span style={{ width: '32px', height: '32px', flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: '10px', background: notification.type === 'message_received' ? 'rgba(234,170,0,0.14)' : 'rgba(221,227,232,0.08)', fontSize: '16px' }}>
                    {notification.type === 'message_received' ? '💬' : '🔔'}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      <strong style={{ color: '#f3eff4', fontSize: '12px', lineHeight: 1.4 }}>{notification.title}</strong>
                      {!notification.is_read && <span aria-label="Unread" style={{ width: '7px', height: '7px', marginTop: '4px', flexShrink: 0, borderRadius: '50%', background: '#EAAA00' }} />}
                    </span>
                    <span style={{ display: 'block', marginTop: '4px', color: '#b7aabb', fontSize: '11px', lineHeight: 1.45, overflowWrap: 'anywhere' }}>{notification.message}</span>
                    <span style={{ display: 'block', marginTop: '6px', color: '#817487', fontSize: '10px' }}>{timeAgo(notification.created_at)}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Mobile Menu */}
        {open && (
          <div className="md:hidden pb-4 pt-2 animate-fade-down" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex flex-col gap-1 mt-2">
              {navLinks.map((l) => (
                <Link key={l.to} to={l.to} style={{ color: '#94a3b8', padding: '10px 12px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>
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
              <a
                href={HELP_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#60a5fa', padding: '10px 12px', borderRadius: '10px', fontSize: '14px', textDecoration: 'none', fontWeight: 600 }}
              >
                🎧 Help & Support
              </a>
            </div>
          </div>
        )}
        {signOutError && <p role="alert" style={{ color: '#f87171', fontSize: '12px', padding: '0 12px 8px' }}>{signOutError}</p>}
      </div>
    </nav>
  )
}
