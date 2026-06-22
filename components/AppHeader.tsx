'use client'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PresenceUser } from '@/lib/realtime'

interface AppHeaderProps {
  onlineUsers: PresenceUser[]
  onChatToggle: () => void
  unreadCount: number
}

export default function AppHeader({
  onlineUsers,
  onChatToggle,
  unreadCount,
}: AppHeaderProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-white-warm border-b border-sand shadow-warm z-50 flex items-center justify-between px-4 md:px-6">
      {/* Left: app title */}
      <div className="font-extrabold text-brown text-base tracking-tight">RandomResident</div>

      {/* Center: online users */}
      <div className="flex items-center gap-3">
        <div className="text-xs text-brown-light">{onlineUsers.length} online</div>

        {/* Compact avatar dots */}
        <div className="flex items-center gap-1">
          {onlineUsers.slice(0, 5).map((u) => (
            <div
              key={u.userId}
              className="w-6 h-6 rounded-full border-2 border-white-warm"
              style={{ backgroundColor: u.color }}
              title={u.name}
            />
          ))}
          {onlineUsers.length > 5 && (
            <div className="text-xs text-brown-light ml-1">+{onlineUsers.length - 5}</div>
          )}
        </div>
      </div>

      {/* Right: chat toggle + sign out */}
      <div className="flex items-center gap-2">
        <button
          onClick={onChatToggle}
          className="relative text-lg hover:bg-sand rounded-full p-2 transition-colors"
          title="Toggle chat panel"
        >
          💬
          {unreadCount > 0 && (
            <div className="absolute -top-0.5 -right-0.5 bg-coral text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </button>

        <button
          onClick={handleSignOut}
          className="text-coral hover:bg-coral/10 rounded-full px-3 py-1 font-semibold text-sm transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
