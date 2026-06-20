'use client'

import { create } from 'zustand'
import { Memory } from './types'

interface MemoriesStore {
  memoriesByResident: Record<string, Memory[]>
  loadMemories: (residentId: string, memories: Memory[]) => void
}

export const useMemoriesStore = create<MemoriesStore>((set) => ({
  memoriesByResident: {},

  loadMemories: (residentId: string, memories: Memory[]) => {
    set((state) => ({
      memoriesByResident: {
        ...state.memoriesByResident,
        [residentId]: memories,
      },
    }))
  },
}))
