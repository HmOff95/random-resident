import { supabase } from './supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

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
