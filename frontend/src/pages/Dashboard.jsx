// src/pages/Dashboard.jsx
import { useAuth } from '../contexts/AuthContext'
import FarmerDashboard from './dashboards/FarmerDashboard'
import LaborDashboard from './dashboards/LaborDashboard'
import AssetOwnerDashboard from './dashboards/AssetOwnerDashboard'
import DealerDashboard from './dashboards/DealerDashboard'
import BuyerDashboard from './dashboards/BuyerDashboard'

const ROLE_MAP = {
  farmer:      FarmerDashboard,
  labor:       LaborDashboard,
  asset_owner: AssetOwnerDashboard,
  dealer:      DealerDashboard,
  buyer:       BuyerDashboard,
  // legacy aliases — in case old accounts exist
  equipment_owner: AssetOwnerDashboard,
  livestock_owner: AssetOwnerDashboard,
}

export default function Dashboard() {
  const { role } = useAuth()
  const RoleDashboard = ROLE_MAP[role] || FarmerDashboard
  return <RoleDashboard />
}
