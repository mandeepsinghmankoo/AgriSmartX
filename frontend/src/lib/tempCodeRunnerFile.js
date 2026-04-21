// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://tsbfpbcxtlbiicyuffky.supabase.co'

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzYmZwYmN4dGxiaWljeXVmZmt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzY0MTUsImV4cCI6MjA4OTg1MjQxNX0.5s5oJmcUrE-P8kPnqg1xmdw6iAk-xyifS8Ecu5iOOWM'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}