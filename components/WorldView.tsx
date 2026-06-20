'use client'

import { useEffect, useRef, useState } from 'react'
import { useAnimationFrame } from 'framer-motion'
import { ROOM_BOUNDS } from '@/lib/types'
import { useResidentStore } from '@/lib/residentStore'
import { supabase } from '@/lib/supabase/client'
import { createWorldChannels } from '@/lib/realtime'
import ResidentAvatar from './ResidentAvatar'
import TopicModal from './TopicModal'

export default function WorldView() {
  const { residents, loadResidents, simulateStep, addResident, removeResident, updateResidentIdentity, updateResidentPosition } = useResidentStore()
  const [user, setUser] = useState<any>(null)
  const [selectedResidentId, setSelectedResidentId] = useState<string | null>(null)
  const [hasSeenScrollHint, setHasSeenScrollHint] = useState(false)
  const positionChannelRef = useRef<any>(null)
  const identityChannelRef = useRef<any>(null)
  const residentsRef = useRef(residents)
  const lastBroadcast = useRef(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Fetch current user and load initial residents
  useEffect(() => {
    const fetchUserAndResidents = async () => {
      const { data: { user: sessionUser } } = await supabase.auth.getUser()
      if (sessionUser) {
        setUser(sessionUser)
      }

      const { data } = await supabase.from('residents').select('*')
      if (data) {
        loadResidents(data)
      }
    }

    fetchUserAndResidents()
  }, [loadResidents])

  // Keep residentsRef in sync with residents state
  useEffect(() => {
    residentsRef.current = residents
  }, [residents])

  // Set up realtime channels — only re-run when user changes
  useEffect(() => {
    if (!user) return

    const { positionChannel, identityChannel } = createWorldChannels(
      // onPositionUpdate — only apply to residents we DON'T own
      (residentId, x, y) => {
        const resident = residentsRef.current.find(r => r.id === residentId)
        if (resident && resident.owner_id !== user.id) {
          updateResidentPosition(residentId, { x, y })
        }
      },
      // onResidentInsert
      (row) => addResident(row),
      // onResidentUpdate
      (row) => updateResidentIdentity(row.id, { name: row.name, photo_url: row.photo_url }),
      // onResidentDelete
      (id) => removeResident(id),
    )

    positionChannelRef.current = positionChannel
    identityChannelRef.current = identityChannel

    return () => {
      supabase.removeChannel(positionChannel)
      supabase.removeChannel(identityChannel)
    }
  }, [user])

  useAnimationFrame((time, delta) => {
    simulateStep(delta / 1000) // delta is in ms, convert to seconds

    // Broadcast positions for owned residents, throttled to once per second
    if (user && positionChannelRef.current && time - lastBroadcast.current > 1000) {
      lastBroadcast.current = time
      const myResidents = residents.filter(r => r.owner_id === user.id)
      myResidents.forEach(r => {
        positionChannelRef.current.send({
          type: 'broadcast',
          event: 'position',
          payload: { residentId: r.id, x: r.position.x, y: r.position.y }
        })
      })
    }
  })

  return (
    <>
      {/* Scroll hint for mobile */}
      {!hasSeenScrollHint && (
        <div className="md:hidden fixed top-4 left-1/2 transform -translate-x-1/2 z-30 bg-gray-900 text-white text-sm px-4 py-2 rounded-full shadow-lg animate-bounce">
          Scroll to explore the room 👆
        </div>
      )}

      {/* Scroll Container - scrollable on mobile, centered on desktop */}
      <div
        ref={scrollContainerRef}
        className="md:flex md:items-center md:justify-center w-full overflow-auto"
        style={{
          minHeight: 'min(100vh, calc(100vh - 120px))',
        }}
        onScroll={() => {
          if (!hasSeenScrollHint) {
            setHasSeenScrollHint(true)
          }
        }}
      >
        {/* Room container */}
        <div
          className="relative rounded-lg border-2 border-gray-300 bg-gray-50 shadow-lg flex-shrink-0"
          style={{
            width: ROOM_BOUNDS.width,
            height: ROOM_BOUNDS.height,
          }}
        >
          {residents.map((resident) => (
            <ResidentAvatar
              key={resident.id}
              resident={resident}
              onAvatarClick={() => setSelectedResidentId(resident.id)}
            />
          ))}

          {selectedResidentId && user && (
            <TopicModal
              residentId={selectedResidentId}
              residentName={residents.find(r => r.id === selectedResidentId)?.name || 'Unknown'}
              userId={user.id}
              onClose={() => setSelectedResidentId(null)}
            />
          )}
        </div>
      </div>
    </>
  )
}
