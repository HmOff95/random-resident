import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabaseAdmin: SupabaseClient | null = null

// Server-only client using the service role key — bypasses RLS.
// NEVER import this file from any 'use client' component.
// Lazily initialized so a missing env var only fails at request time
// (inside the route handler, with a clear error) rather than crashing
// the entire production build during static analysis.
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      throw new Error(
        'Missing Supabase admin credentials: ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in this environment.'
      )
    }

    _supabaseAdmin = createClient(url, key, {
      auth: { persistSession: false },
    })
  }
  return _supabaseAdmin
}
