// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

// Offline auto-logout after 30 minutes
const OFFLINE_TIMEOUT_MS = 30 * 60 * 1000

async function fetchProfile(userId) {
  const { data } = await supabase.from('users').select('*').eq('id', userId).single()
  if (data) return data
  // fallback: some rows may use user_id as the lookup key
  const { data: d2 } = await supabase.from('users').select('*').eq('user_id', userId).single()
  return d2
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const offlineTimer          = useRef(null)
  const navigateRef           = useRef(null) // set by Navbar

  // ── Offline timer helpers ──
  function clearOfflineTimer() {
    if (offlineTimer.current) {
      clearTimeout(offlineTimer.current)
      offlineTimer.current = null
    }
  }

  function startOfflineTimer() {
    clearOfflineTimer()
    offlineTimer.current = setTimeout(() => {
      // Auto-logout after 30min offline
      handleSignOut()
    }, OFFLINE_TIMEOUT_MS)
  }

  // ── Network listeners ──
  useEffect(() => {
    function onOnline()  { clearOfflineTimer() }
    function onOffline() { if (user) startOfflineTimer() }

    window.addEventListener('online',  onOnline)
    window.addEventListener('offline', onOffline)

    // If already offline when mounting
    if (!navigator.onLine && user) startOfflineTimer()

    return () => {
      window.removeEventListener('online',  onOnline)
      window.removeEventListener('offline', onOffline)
      clearOfflineTimer()
    }
  }, [user])

  // ── Auth state ──
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id).then(setProfile).catch(() => {})
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id).then(setProfile).catch(() => {})
        clearOfflineTimer()
      } else {
        setUser(null)
        setProfile(null)
        clearOfflineTimer()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    clearOfflineTimer()
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    // Hard redirect to login — works even if useNavigate isn't available
    window.location.href = '/login'
  }

  const role = profile?.role || user?.user_metadata?.role || 'farmer'

  return (
    <AuthContext.Provider value={{ user, profile, role, loading, signOut: handleSignOut, setProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
