import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function generateNoAset(kategori) {
  const tahun = new Date().getFullYear()
  const kod = {
    'ICT': 'ICT',
    'Perabot': 'PRB',
    'Sukan': 'SKN',
    'Buku': 'BKU',
    'Elektrik': 'ELK',
    'Lain-lain': 'LLN',
  }[kategori] || 'AST'
  const random = Math.floor(Math.random() * 900) + 100
  return `ASET/${kod}/${tahun}/${random}`
}
