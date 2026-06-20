import { supabase } from './supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface CursorPayload {
  userId: string
  x: number
  y: number
  name: string
  color: string
}

export interface PresenceUser {
  userId: string
  name: string
  color: string
  online_at: string
}

export function createWorldChannels(
  onPositionUpdate: (residentId: string, x: number, y: number) => void,
  onResidentInsert: (row: any) => void,
  onResidentUpdate: (row: any) => void,
  onResidentDelete: (id: string) => void,
): { positionChannel: RealtimeChannel; identityChannel: RealtimeChannel } {
  const positionChannel = supabase
    .channel('world-positions')
    .on('broadcast', { event: 'position' }, ({ payload }) => {
      onPositionUpdate(payload.residentId, payload.x, payload.y)
    })
    .subscribe()

  const identityChannel = supabase
    .channel('world-identity')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'residents' },
      ({ new: row }) => onResidentInsert(row),
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'residents' },
      ({ new: row }) => onResidentUpdate(row),
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'residents' },
      ({ old: row }) => onResidentDelete(row.id),
    )
    .subscribe()

  return { positionChannel, identityChannel }
}

export function createPresenceChannel(
  currentUser: { userId: string; name: string; color: string },
  onCursorUpdate: (cursor: CursorPayload) => void,
  onPresenceSync: (users: PresenceUser[]) => void,
): RealtimeChannel {
  const channel = supabase.channel('world-presence', {
    config: { presence: { key: currentUser.userId } },
  })

  channel
    .on('broadcast', { event: 'cursor' }, ({ payload }) => {
      onCursorUpdate(payload as CursorPayload)
    })
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      const users = Object.values(state).flat()
      onPresenceSync(users as PresenceUser[])
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          userId: currentUser.userId,
          name: currentUser.name,
          color: currentUser.color,
          online_at: new Date().toISOString(),
        })
      }
    })

  return channel
}

export function broadcastCursor(
  channel: RealtimeChannel,
  payload: CursorPayload
): void {
  channel.send({
    type: 'broadcast',
    event: 'cursor',
    payload,
  })
}
