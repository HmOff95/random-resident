import { create } from 'zustand'
import { Resident, Position, Gender, ROOM_BOUNDS, AVATAR_SIZE, ARRIVAL_THRESHOLD, speedFor } from './types'
import { decideNextIntent, randomPointInRoom, clampToRoom, resolveCollisions } from './simulation'
import type { ResidentRow } from './supabase/types'

interface ResidentStore {
  residents: Resident[]
  initResidents: () => void
  loadResidents: (rows: ResidentRow[]) => void
  addResident: (row: ResidentRow) => void
  removeResident: (id: string) => void
  updateResidentIdentity: (id: string, updates: { name?: string; photo_url?: string | null; color?: string; gender?: Gender; likes?: string[]; dislikes?: string[] }) => void
  updateResidentPosition: (id: string, position: Position) => void
  simulateStep: (dt: number) => void
}

const RESIDENT_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A']
const RESIDENT_NAMES = ['Bo', 'Mira', 'Tako', 'Yuna']

function createInitialResident(
  id: string,
  owner_id: string,
  name: string,
  color: string
): Resident {
  const now = Date.now()
  return {
    id,
    owner_id,
    name,
    color,
    gender: 'unspecified',
    likes: [],
    dislikes: [],
    mood: 'content',
    ai_reason: null,
    ai_reason_set_at: null,
    position: randomPointInRoom(),
    intent: {
      type: 'idle',
      reason: 'just waking up',
      target: { x: 0, y: 0 },
      startedAt: now,
      duration: 1500 + Math.random() * 1500,
    },
    traits: {
      sociability: Math.random(),
      energy: Math.random(),
    },
  }
}

export const useResidentStore = create<ResidentStore>((set) => ({
  residents: [],

  initResidents: () => {
    const initialResidents = RESIDENT_NAMES.map((name, index) =>
      createInitialResident(`resident-${index}`, name, RESIDENT_COLORS[index])
    )
    set({ residents: initialResidents })
  },

  loadResidents: (rows: ResidentRow[]) => {
    let loadedResidents = rows.map((row) => {
      const now = Date.now()
      return {
        id: row.id,
        owner_id: row.owner_id,
        name: row.name,
        color: row.color,
        photo_url: row.photo_url,
        gender: row.gender,
        likes: row.likes,
        dislikes: row.dislikes,
        mood: row.mood,
        ai_reason: row.ai_reason,
        ai_reason_set_at: row.ai_reason_set_at,
        position: randomPointInRoom(),
        intent: {
          type: 'idle' as const,
          reason: 'is settling in',
          target: randomPointInRoom(),
          startedAt: now,
          duration: 1000 + Math.random() * 2000,
        },
        traits: {
          sociability: row.sociability,
          energy: row.energy,
        },
      } as Resident
    })

    // Resolve collisions on initial load
    resolveCollisions(loadedResidents)

    set({ residents: loadedResidents })
  },

  addResident: (row: ResidentRow) => {
    set((state) => {
      const now = Date.now()
      const newResident: Resident = {
        id: row.id,
        owner_id: row.owner_id,
        gender: row.gender,
        likes: row.likes,
        dislikes: row.dislikes,
        mood: row.mood,
        ai_reason: row.ai_reason,
        ai_reason_set_at: row.ai_reason_set_at,
        name: row.name,
        color: row.color,
        photo_url: row.photo_url,
        position: randomPointInRoom(),
        intent: {
          type: 'idle',
          reason: 'is settling in',
          target: randomPointInRoom(),
          startedAt: now,
          duration: 1000 + Math.random() * 2000,
        },
        traits: {
          sociability: row.sociability,
          energy: row.energy,
        },
      }

      const updatedResidents = [...state.residents, newResident]
      resolveCollisions(updatedResidents)
      return { residents: updatedResidents }
    })
  },

  removeResident: (id: string) => {
    set((state) => ({
      residents: state.residents.filter((r) => r.id !== id),
    }))
  },

  updateResidentIdentity: (
    id: string,
    updates: {
      name?: string
      photo_url?: string | null
      color?: string
      gender?: Gender
      likes?: string[]
      dislikes?: string[]
    }
  ) => {
    set((state) => ({
      residents: state.residents.map((resident) =>
        resident.id === id
          ? {
              ...resident,
              ...(updates.name !== undefined && { name: updates.name }),
              ...(updates.photo_url !== undefined && { photo_url: updates.photo_url }),
              ...(updates.color !== undefined && { color: updates.color }),
              ...(updates.gender !== undefined && { gender: updates.gender }),
              ...(updates.likes !== undefined && { likes: updates.likes }),
              ...(updates.dislikes !== undefined && { dislikes: updates.dislikes }),
            }
          : resident
      ),
    }))
  },

  updateResidentPosition: (id: string, position: Position) => {
    set((state) => ({
      residents: state.residents.map((resident) =>
        resident.id === id ? { ...resident, position } : resident
      ),
    }))
  },

  simulateStep: (dt: number) => {
    set((state) => {
      const now = Date.now()
      let updatedResidents = state.residents.map((resident) => {
        const timeSinceStart = now - resident.intent.startedAt

        // Check if intent duration exceeded
        if (timeSinceStart >= resident.intent.duration) {
          const nextIntent = decideNextIntent(resident, state.residents, now)
          return {
            ...resident,
            intent: nextIntent,
            position: resident.position, // Keep current position
          }
        }

        // Handle wander/seek_resident movement
        if (
          resident.intent.type === 'wander' ||
          resident.intent.type === 'seek_resident'
        ) {
          const dx = resident.intent.target.x - resident.position.x
          const dy = resident.intent.target.y - resident.position.y
          const distanceToTarget = Math.sqrt(dx * dx + dy * dy)

          // Check if arrived
          if (distanceToTarget <= ARRIVAL_THRESHOLD) {
            return resident // Stay at target
          }

          // Move toward target
          const speed = speedFor(resident.traits)
          const moveDistance = speed * dt

          if (moveDistance >= distanceToTarget) {
            // Snap to target to avoid overshooting
            return {
              ...resident,
              position: resident.intent.target,
            }
          }

          // Move by moveDistance toward target
          const nx = dx / distanceToTarget
          const ny = dy / distanceToTarget
          return {
            ...resident,
            position: {
              x: resident.position.x + nx * moveDistance,
              y: resident.position.y + ny * moveDistance,
            },
          }
        }

        // Idle - no position change
        return resident
      })

      // Resolve collisions
      resolveCollisions(updatedResidents)

      // Clamp all positions to room bounds
      updatedResidents = updatedResidents.map((resident) => ({
        ...resident,
        position: clampToRoom(resident.position),
      }))

      return { residents: updatedResidents }
    })
  },
}))
