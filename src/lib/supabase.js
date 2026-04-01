import { createClient } from '@supabase/supabase-js'

// ─── SETUP INSTRUCTIONS ────────────────────────────────────────────────────
// 1. Go to https://supabase.com → New project (free)
// 2. Copy your Project URL and anon key from Settings → API
// 3. Replace the two values below
// 4. In Supabase SQL Editor, run the schema in SUPABASE_SCHEMA.sql
// ──────────────────────────────────────────────────────────────────────────

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ─── AUTH HELPERS ──────────────────────────────────────────────────────────
export const signUp = (email, password) =>
  supabase.auth.signUp({ email, password })

export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const signOut = () => supabase.auth.signOut()

export const getUser = () => supabase.auth.getUser()

// ─── WATCHLIST ─────────────────────────────────────────────────────────────
export const getWatchlist = async (userId) => {
  const { data, error } = await supabase
    .from('watchlist')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export const addToWatchlist = async (userId, ticker, name, sector) => {
  const { data, error } = await supabase
    .from('watchlist')
    .upsert({ user_id: userId, ticker, name, sector }, { onConflict: 'user_id,ticker' })
    .select()
  return { data, error }
}

export const removeFromWatchlist = async (userId, ticker) => {
  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', userId)
    .eq('ticker', ticker)
  return { error }
}

// ─── NOTES ─────────────────────────────────────────────────────────────────
export const getNotes = async (userId, ticker) => {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .eq('ticker', ticker)
    .order('updated_at', { ascending: false })
  return { data, error }
}

export const upsertNote = async (userId, ticker, content) => {
  const { data, error } = await supabase
    .from('notes')
    .upsert(
      { user_id: userId, ticker, content, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,ticker' }
    )
    .select()
  return { data, error }
}

// ─── ALERTS ────────────────────────────────────────────────────────────────
export const getAlerts = async (userId) => {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export const addAlert = async (userId, ticker, type, targetPrice) => {
  const { data, error } = await supabase
    .from('alerts')
    .insert({ user_id: userId, ticker, type, target_price: targetPrice, triggered: false })
    .select()
  return { data, error }
}

export const deleteAlert = async (alertId) => {
  const { error } = await supabase.from('alerts').delete().eq('id', alertId)
  return { error }
}

export const markAlertTriggered = async (alertId) => {
  const { error } = await supabase
    .from('alerts')
    .update({ triggered: true, triggered_at: new Date().toISOString() })
    .eq('id', alertId)
  return { error }
}
