// src/lib/auth.js
import { supabase } from './supabase'

export async function signUp(email, password, name, phone, role) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        phone,
        role,
        user_id: `USER_${Date.now()}`,
      },
    },
  })
  if (error) throw error
  return data
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signInWithPhone(phone) {
  const { data, error } = await supabase.auth.signInWithOtp({
    phone,
    options: { shouldCreateUser: true },
  })
  if (error) throw error
  return data
}

export async function verifyOTP(phone, token) {
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
