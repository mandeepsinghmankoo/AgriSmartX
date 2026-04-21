// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Navbar from './components/common/Navbar'
import Footer from './components/common/Footer'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Listings from './pages/Listings'
import ListingDetail from './pages/ListingDetail'
import CreateListing from './pages/CreateListing'
import MyBookings from './pages/MyBookings'
import Profile from './pages/Profile'
import Dashboard from './pages/Dashboard'
import Marketplace from './pages/Marketplace'
import CropSales from './pages/CropSales'
import PostCrop from './pages/PostCrop'

// Alternating brown-rose and aqua particles
const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: `${(i * 3.6 + Math.sin(i * 0.9) * 12 + 100) % 100}%`,
  width: i % 5 === 0 ? 5 : i % 3 === 0 ? 3 : 2,
  duration: `${12 + (i % 7) * 3}s`,
  delay: `${-(i * 1.2)}s`,
  opacity: 0.18 + (i % 4) * 0.07,
  background: i % 2 === 0
    ? 'rgba(167, 100, 80, 0.7)'   // warm brown-rose
    : 'rgba(30, 160, 155, 0.6)',  // aqua-teal
}))

function GlobalBackground() {
  return (
    <div id="app-bg">
      {PARTICLES.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            width: p.width,
            height: p.width,
            animationDuration: p.duration,
            animationDelay: p.delay,
            opacity: p.opacity,
            background: p.background,
          }}
        />
      ))}
    </div>
  )
}

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

const ROLE_ACCESS = {
  '/create-listing': ['farmer', 'labor', 'equipment_owner', 'livestock_owner', 'dealer'],
  '/my-bookings':    ['farmer', 'labor', 'equipment_owner', 'livestock_owner', 'dealer'],
  '/dashboard':      ['farmer', 'labor', 'equipment_owner', 'livestock_owner', 'dealer'],
  '/post-crop':      ['farmer'],
}

function RoleRoute({ path, children }) {
  const { user, role } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  const allowed = ROLE_ACCESS[path]
  if (allowed && !allowed.includes(role)) return <Navigate to="/dashboard" replace />
  return children
}

function App() {
  return (
    <>
      <GlobalBackground />
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
        <Navbar />
        <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '32px 20px' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/listings" element={<PrivateRoute><Listings /></PrivateRoute>} />
            <Route path="/listings/:id" element={<PrivateRoute><ListingDetail /></PrivateRoute>} />
            <Route path="/marketplace" element={<PrivateRoute><Marketplace /></PrivateRoute>} />
            <Route path="/marketplace/:id" element={<PrivateRoute><Marketplace /></PrivateRoute>} />
            <Route path="/create-listing" element={<RoleRoute path="/create-listing"><CreateListing /></RoleRoute>} />
            <Route path="/my-bookings" element={<RoleRoute path="/my-bookings"><MyBookings /></RoleRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/dashboard" element={<RoleRoute path="/dashboard"><Dashboard /></RoleRoute>} />
            <Route path="/crop-sales" element={<PrivateRoute><CropSales /></PrivateRoute>} />
            <Route path="/post-crop" element={<RoleRoute path="/post-crop"><PostCrop /></RoleRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </>
  )
}

export default App
