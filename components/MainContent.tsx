'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase/client'
import WorldView from './WorldView'
import ResidentEditorPanel from './ResidentEditorPanel'

export default function MainContent() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <p className="text-gray-700 text-lg">
          You need to sign in to enter the living room.
        </p>
        <Link
          href="/login"
          className="rounded bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-3 transition-colors"
        >
          Go to Sign In
        </Link>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={handleSignOut}
        className="absolute top-0 right-0 text-sm text-red-600 hover:text-red-800 font-medium z-40"
      >
        Sign Out
      </button>
      <WorldView />
      <ResidentEditorPanel user={user} />
    </div>
  )
}
