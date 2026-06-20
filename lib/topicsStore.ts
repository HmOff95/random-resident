'use client'

import { create } from 'zustand'
import { Topic } from './types'

interface TopicsStore {
  topicsByResident: Record<string, Topic[]>
  loadTopics: (residentId: string, topics: Topic[]) => void
  addTopic: (topic: Topic) => void
}

export const useTopicsStore = create<TopicsStore>((set) => ({
  topicsByResident: {},

  loadTopics: (residentId: string, topics: Topic[]) => {
    set((state) => ({
      topicsByResident: {
        ...state.topicsByResident,
        [residentId]: topics,
      },
    }))
  },

  addTopic: (topic: Topic) => {
    set((state) => ({
      topicsByResident: {
        ...state.topicsByResident,
        [topic.resident_id]: [...(state.topicsByResident[topic.resident_id] || []), topic],
      },
    }))
  },
}))
