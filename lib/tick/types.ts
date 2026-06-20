export interface TickResidentInput {
  id: string
  name: string
  gender: string
  sociability: number
  energy: number
  likes: string[]
  dislikes: string[]
  mood: string
  recentMemories: string[] // up to 10, newest first
  nearbyResidentNames: string[] // residents currently in 'seek_resident'/close proximity — keep simple: just pass all other batch member names for now
  pendingTopics: string[] // unused topic_text values for this resident
}

export interface TickResidentOutput {
  id: string
  reason: string // new short status line, same flavor as existing rule-based reasons
  newMemory: string | null // a short memory sentence to store, or null if nothing memorable happened
  newMood: string | null // updated mood (single word/short phrase), or null to keep current mood
}

export interface TickResponse {
  results: TickResidentOutput[]
}
