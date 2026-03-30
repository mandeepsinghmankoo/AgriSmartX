// src/lib/roles.js

export const ROLE_CAN_POST = {
  farmer:      ['land'],
  labor:       ['labor'],
  asset_owner: ['equipment', 'livestock'],  // merged role
  dealer:      ['equipment', 'livestock', 'product'],
  buyer:       [],
}

export const ROLE_CAN_BOOK = {
  farmer:      ['equipment', 'land', 'labor', 'livestock'],
  labor:       [],
  asset_owner: [],
  dealer:      ['equipment', 'livestock'],
  buyer:       ['product'],
}

export const ROLE_META = {
  farmer:      { label: 'Farmer',      icon: '🌾',  color: '#86efac' },
  labor:       { label: 'Labor',       icon: '👨🌾', color: '#fbbf24' },
  asset_owner: { label: 'Asset Owner', icon: '🚜',  color: '#60a5fa' },
  dealer:      { label: 'Dealer',      icon: '🏪',  color: '#a78bfa' },
  buyer:       { label: 'Buyer',       icon: '🛍️',  color: '#34d399' },
}

export const AGRI_ROLES = ['farmer', 'labor', 'asset_owner', 'dealer']

export function canPost(role, type) {
  return ROLE_CAN_POST[role]?.includes(type) ?? false
}

export function canBook(role, type) {
  return ROLE_CAN_BOOK[role]?.includes(type) ?? false
}

export function getAllowedPostTypes(role) {
  return ROLE_CAN_POST[role] || []
}

export function isAgriRole(role) {
  return AGRI_ROLES.includes(role)
}

export function isBuyer(role) {
  return role === 'buyer'
}
