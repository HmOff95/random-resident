'use client'

import { Resident, AVATAR_SIZE } from '@/lib/types'
import { useTopicsStore } from '@/lib/topicsStore'

interface ResidentAvatarProps {
  resident: Resident
  onAvatarClick: () => void
}

export default function ResidentAvatar({ resident, onAvatarClick }: ResidentAvatarProps) {
  const { topicsByResident } = useTopicsStore()
  const pendingTopics = topicsByResident[resident.id] || []
  const hasPendingTopics = pendingTopics.length > 0

  return (
    <div
      className="absolute"
      style={{
        x: resident.position.x - AVATAR_SIZE / 2,
        y: resident.position.y - AVATAR_SIZE / 2,
        transform: `translate(${resident.position.x - AVATAR_SIZE / 2}px, ${resident.position.y - AVATAR_SIZE / 2}px)`,
      }}
    >
      {/* Reason bubble */}
      <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-2xl bg-brown text-white px-3 py-1.5 text-xs whitespace-nowrap max-w-xs overflow-hidden text-ellipsis drop-shadow-sm">
        {resident.intent.reason}
      </div>

      {/* Avatar circle */}
      <div
        onClick={onAvatarClick}
        className="flex cursor-pointer items-center justify-center rounded-full shadow-resident border-2 border-white-warm transition-transform hover:scale-110"
        style={{
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          backgroundColor: resident.color,
          backgroundImage: resident.photo_url
            ? `url(${resident.photo_url})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Topic indicator badge */}
        {hasPendingTopics && (
          <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-mint text-xs font-bold text-white">
            💭
          </div>
        )}

        {/* Name label */}
        <div className="absolute top-full mt-1 text-center font-bold text-brown text-xs drop-shadow-sm">
          {resident.name}
        </div>
      </div>
    </div>
  )
}
