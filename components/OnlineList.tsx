'use client'

import { PresenceUser } from '@/lib/realtime'

interface OnlineListProps {
  users: PresenceUser[]
}

export default function OnlineList({ users }: OnlineListProps) {
  return (
    <div
      className="fixed top-4 left-4 z-20 bg-white rounded-lg border border-gray-300 shadow-lg overflow-hidden"
      style={{
        maxHeight: 'calc(100vh - 32px)',
        maxWidth: '200px',
      }}
    >
      <div className="px-3 py-2 bg-gray-100 border-b border-gray-300 font-semibold text-sm">
        Online ({users.length})
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
        {users.map((user) => (
          <div
            key={user.userId}
            className="px-3 py-2 border-b border-gray-200 last:border-b-0 flex items-center gap-2 text-sm"
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{
                backgroundColor: user.color,
              }}
            />
            <span className="truncate text-gray-800">{user.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
