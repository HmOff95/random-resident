import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

// Lazily initialized so static generation (which runs this module in a
// non-browser context without real env vars resolved) doesn't crash the
// build. Real usage always happens in 'use client' components at runtime,
// where env vars are available.
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      throw new Error(
        'Missing Supabase credentials: ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
      )
    }

    _supabase = createClient(url, key)
  }
  return _supabase
}

// Backward-compatible proxy: allows existing code that does
// `supabase.from(...)`, `supabase.auth.signIn(...)`, etc. to keep working
// without every call site needing to change to `getSupabase().from(...)`.
// The proxy defers actual client creation until a property is first
// accessed, which only happens at runtime in the browser, never during
// static generation.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase()
    const value = (client as any)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})
