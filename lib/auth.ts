'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from './supabase/client'

export function useAuth(): {
  user: User | null
  loading: boolean
} {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        setUser(data.session?.user ?? null)
      } catch (error) {
        console.error('Failed to get session:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Subscribe to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    // Clean up subscription on unmount
    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}
