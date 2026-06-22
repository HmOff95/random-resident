'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

const COLOR_PALETTE = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3']

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const getRandomColor = () => COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isSignUp) {
        // Sign up
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (signUpError) throw signUpError

        if (data.user) {
          // Insert resident row
          const { error: insertError } = await supabase.from('residents').insert({
            owner_id: data.user.id,
            name: email.split('@')[0],
            color: getRandomColor(),
          })

          if (insertError) {
            // Auth account exists but resident creation failed — surface this
            // clearly rather than a generic error, since the user technically
            // has an account now
            throw new Error(
              `Account created, but we couldn't set up your first resident: ${insertError.message}. Try signing in — you can add a resident from the panel.`
            )
          }
        }
      } else {
        // Sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw signInError
      }

      // Redirect to home
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white-warm shadow-warm p-8">
        <h1 className="mb-1 text-2xl font-extrabold text-brown text-center">
          Random Resident
        </h1>
        <p className="mb-6 text-brown-light text-sm text-center">
          {isSignUp ? 'Join the living room' : 'Welcome back'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-brown mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-full border border-sand px-4 py-2.5 bg-cream text-brown placeholder:text-brown-light focus:border-coral focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-brown mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-full border border-sand px-4 py-2.5 bg-cream text-brown placeholder:text-brown-light focus:border-coral focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-coral/10 border border-coral p-3 text-sm text-coral">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-coral hover:bg-coral-dark disabled:opacity-40 text-white font-bold py-2.5 transition-colors shadow-coral"
          >
            {loading
              ? isSignUp
                ? 'Creating account...'
                : 'Signing in...'
              : isSignUp
              ? 'Sign Up'
              : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-brown-light text-sm">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </p>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-coral hover:text-coral-dark font-semibold text-sm mt-2"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </main>
  )
}
