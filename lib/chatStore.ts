import { create } from 'zustand'
import { MessageRow } from './supabase/types'
import { MAX_CHAT_HISTORY } from './types'

export interface ChatMessage extends MessageRow {
  isNearby?: boolean // computed client-side based on current user's cursor position
}

interface ChatStore {
  messages: ChatMessage[]
  loadMessages: (rows: MessageRow[]) => void
  addMessage: (row: MessageRow) => void
  updateProximity: (myX: number, myY: number, threshold: number) => void
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],

  loadMessages: (rows) => {
    set({ messages: rows.map((r) => ({ ...r, isNearby: true })) })
    // proximity will be recalculated on next cursor move
  },

  addMessage: (row) => {
    set((state) => ({
      messages: [...state.messages, { ...row, isNearby: true }].slice(-MAX_CHAT_HISTORY),
    }))
  },

  updateProximity: (myX, myY, threshold) => {
    set((state) => ({
      messages: state.messages.map((msg) => {
        const dx = msg.x - myX
        const dy = msg.y - myY
        const dist = Math.sqrt(dx * dx + dy * dy)
        return { ...msg, isNearby: dist <= threshold }
      }),
    }))
  },
}))
