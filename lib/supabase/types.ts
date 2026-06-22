export interface ResidentRow {
  id: string
  owner_id: string
  name: string
  photo_url: string | null
  color: string
  gender: 'male' | 'female' | 'unspecified'
  likes: string[]
  dislikes: string[]
  sociability: number
  energy: number
  mood: string
  ai_reason: string | null
  ai_reason_set_at: string | null
  last_ticked_at: string
  created_at: string
}

export interface MemoryRow {
  id: string
  resident_id: string
  content: string
  created_at: string
}

export interface TopicRow {
  id: string
  resident_id: string
  submitted_by: string
  topic_text: string
  used: boolean
  created_at: string
}

export interface MessageRow {
  id: string
  user_id: string
  display_name: string
  display_color: string
  content: string
  x: number
  y: number
  created_at: string
}
