import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing. Check your .env file.")
}

export const supabase = createClient(
  supabaseUrl || 'https://onxcfwmwtsotmexzaydk.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueGNmd213dHNvdG1leHpheWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNTMzNDEsImV4cCI6MjA5NjkyOTM0MX0.dit4WxL-3w2hjFQHzRaRFAiP-d2XJIFekeGFGkX8Qsw'
)
