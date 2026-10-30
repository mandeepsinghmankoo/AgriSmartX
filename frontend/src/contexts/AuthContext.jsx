// src/contexts/AuthContext.jsx
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

const IDLE_TIMEOUT_MS = 20 * 60 * 1000
const ACTIVITY_STORAGE_KEY = 'agrismart:last-activity'

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
  const [loading, setLoading] = useState(true)
  const navigate              = useNavigate()
  const idleTimer             = useRef(null)
  const handleSignOut = useCallback(async () => {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = null
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    if (user) localStorage.removeItem(`${ACTIVITY_STORAGE_KEY}:${user.id}`)
    setUser(null)
    setProfile(null)
    navigate('/login', { replace: true })
  }, [navigate, user])

  // ── Auth state ──
  useEffect(() => {
    let active = true
    let authEventReceived = false
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      authEventReceived = true
      const nextUser = session?.user ?? null
      setUser(nextUser)
      if (!nextUser) {
        setProfile(null)
        setLoading(false)
        return
      }
      if (event === 'SIGNED_IN') {
        localStorage.setItem(`${ACTIVITY_STORAGE_KEY}:${nextUser.id}`, String(Date.now()))
      }

      Promise.resolve()
        .then(() => fetchProfile(nextUser.id))
        .then((nextProfile) => {
          if (active) setProfile(nextProfile)
        })
        .catch((error) => console.error('Failed to load user profile:', error))
        .finally(() => {
          if (active) setLoading(false)
        })
    })

    supabase.auth.getSession()
      .then(async ({ data: { session }, error }) => {
        if (error) throw error
        if (!active || authEventReceived) return

        const nextUser = session?.user ?? null
        setUser(nextUser)
        if (nextUser) {
          try {
            setProfile(await fetchProfile(nextUser.id))
          } catch (profileError) {
            console.error('Failed to load user profile:', profileError)
          }
        } else {
          setProfile(null)
        }
      })
      .catch((error) => console.error('Failed to restore authentication session:', error))
      .finally(() => {
        if (active && !authEventReceived) setLoading(false)
      })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user) {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      idleTimer.current = null
      return undefined
    }

    const storageKey = `${ACTIVITY_STORAGE_KEY}:${user.id}`
    let lastActivity = Number(localStorage.getItem(storageKey)) || Date.now()
    let lastStoredActivity = lastActivity

    function scheduleLogout(timestamp) {
      lastActivity = timestamp
      if (idleTimer.current) clearTimeout(idleTimer.current)
      const remaining = IDLE_TIMEOUT_MS - (Date.now() - lastActivity)
      if (remaining <= 0) {
        handleSignOut().catch((error) => {
          console.error('Automatic sign out failed:', error)
          scheduleLogout(Date.now())
        })
      } else {
        idleTimer.current = setTimeout(scheduleLogout, remaining, lastActivity)
      }
    }

    function recordActivity() {
      const now = Date.now()
      scheduleLogout(now)
      if (now - lastStoredActivity >= 10_000) {
        localStorage.setItem(storageKey, String(now))
        lastStoredActivity = now
      }
    }

    function syncActivity(event) {
      if (event.key !== storageKey || !event.newValue) return
      const timestamp = Number(event.newValue)
      if (Number.isFinite(timestamp) && timestamp > lastActivity) {
        lastStoredActivity = timestamp
        scheduleLogout(timestamp)
      }
    }

    localStorage.setItem(storageKey, String(lastActivity))
    scheduleLogout(lastActivity)
    const activityEvents = ['pointerdown', 'keydown', 'scroll', 'touchstart', 'mousemove']
    activityEvents.forEach((eventName) => window.addEventListener(eventName, recordActivity, { passive: true }))
    window.addEventListener('storage', syncActivity)

    return () => {
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, recordActivity))
      window.removeEventListener('storage', syncActivity)
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
  }, [user, handleSignOut])

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
