// src/pages/dashboards/BuyerDashboard.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getNotifications } from '../../lib/notifications'
import { Loader, DashboardShell, StatCard, SectionTitle, NotificationsList } from './FarmerDashboard'

const MARKET_CATS = [
  { id: 'seed',         label: 'Seeds',       icon: '🌱', color: '#86efac' },
  { id: 'fertilizer',   label: 'Fertilizers', icon: '🪣', color: '#fbbf24' },
  { id: 'pesticide',    label: 'Pesticides',  icon: '🧪', color: '#f87171' },
  { id: 'vet_medicine', label: 'Vet Medicine',icon: '💊', color: '#60a5fa' },
  { id: 'tool',         label: 'Farm Tools',  icon: '🔧', color: '#a78bfa' },
  { id: 'feed',         label: 'Animal Feed', icon: '🌾', color: '#f97316' },
]

export default function BuyerDashboard() {
  const { user, profile } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getNotifications().catch(() => []).then(setNotifications).finally(() => setLoading(false))
  }, [])

  const unread = notifications.filter(n => !n.is_read).length

  const TABS = [
    { id: 'overview',      label: 'Overview', icon: '📊' },
    { id: 'shop',          label: 'Shop',     icon: '🛍️' },
    { id: 'notifications', label: 'Alerts',   icon: '🔔', count: unread, highlight: unread > 0 },
  ]

  if (loading) return <Loader />

  return (
    <DashboardShell
      title={`Welcome, ${(profile?.name || user?.user_metadata?.name || 'Buyer').split(' ')[0]} 🛍️`}
      subtitle="Buyer Dashboard"
      action={
        <Link to="/marketplace" className="btn-primary" style={{ textDecoration: 'none', padding: '10px 20px', fontSize: '13px' }}>
          🛒 Shop Now
        </Link>
      }
      tabs={TABS} tab={tab} setTab={setTab}
    >
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '14px' }}>
            <StatCard label="Unread Alerts" value={unread} icon="🔔" color="#fbbf24" />
            <StatCard label="Categories" value={MARKET_CATS.length} icon="📦" color="#34d399" />
          </div>

          {/* Quick shop */}
          <div className="glass" style={{ borderRadius: '20px', padding: '24px' }}>
            <SectionTitle>Shop by Category</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: '12px' }}>
              {MARKET_CATS.map(c => (
                <Link key={c.id} to={`/marketplace?category=${c.id}`} style={{ textDecoration: 'none', padding: '16px 12px', borderRadius: '14px', background: `${c.color}10`, border: `1px solid ${c.color}20`, textAlign: 'center', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 10px 24px rgba(0,0,0,0.3)` }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                  <div style={{ fontSize: '26px', marginBottom: '6px' }}>{c.icon}</div>
                  <div style={{ color: c.color, fontWeight: 600, fontSize: '12px' }}>{c.label}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'shop' && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🛍️</div>
          <h3 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Agri Products Marketplace</h3>
          <p style={{ color: '#475569', fontSize: '14px', marginBottom: '24px' }}>Browse seeds, fertilizers, pesticides, vet medicine & farm tools</p>
          <Link to="/marketplace" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', padding: '12px 28px' }}>
            Open Marketplace →
          </Link>
        </div>
      )}

      {tab === 'notifications' && <NotificationsList notifications={notifications} setNotifications={setNotifications} />}
    </DashboardShell>
  )
}
