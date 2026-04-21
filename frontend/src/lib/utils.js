// src/lib/utils.js

// Format price in Indian Rupees
export function formatPrice(price) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(price)
}

// Format date
export function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })
}

// Format relative time (e.g., "2 days ago")
export function timeAgo(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now - date) / 1000)
    
    let interval = Math.floor(seconds / 31536000)
    if (interval >= 1) return `${interval} year${interval > 1 ? 's' : ''} ago`
    
    interval = Math.floor(seconds / 2592000)
    if (interval >= 1) return `${interval} month${interval > 1 ? 's' : ''} ago`
    
    interval = Math.floor(seconds / 86400)
    if (interval >= 1) return `${interval} day${interval > 1 ? 's' : ''} ago`
    
    interval = Math.floor(seconds / 3600)
    if (interval >= 1) return `${interval} hour${interval > 1 ? 's' : ''} ago`
    
    interval = Math.floor(seconds / 60)
    if (interval >= 1) return `${interval} minute${interval > 1 ? 's' : ''} ago`
    
    return 'just now'
}

// Generate random ID
export function generateId(prefix = '') {
    return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Validate phone number (India)
export function validatePhone(phone) {
    const phoneRegex = /^[6-9]\d{9}$/
    return phoneRegex.test(phone)
}

// Validate email
export function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

// Get listing type label
export function getListingTypeLabel(type) {
    const labels = {
        equipment: 'Equipment',
        land: 'Land',
        livestock: 'Livestock',
        labor: 'Labor'
    }
    return labels[type] || type
}

// Get status badge color
export function getStatusColor(status) {
    const colors = {
        active: 'green',
        pending: 'orange',
        approved: 'blue',
        completed: 'purple',
        cancelled: 'red',
        inactive: 'gray'
    }
    return colors[status] || 'gray'
}

