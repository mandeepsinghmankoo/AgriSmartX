// src/lib/storage.js
import { supabase } from './supabase'

export async function uploadImage(file, bucket = 'listings') {
  const ext = file.name.split('.').pop().toLowerCase()
  const path = `${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${ext}`

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    })

  if (error) throw error

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadMultiple(files, bucket = 'listings') {
  return Promise.all(Array.from(files).map((f) => uploadImage(f, bucket)))
}
