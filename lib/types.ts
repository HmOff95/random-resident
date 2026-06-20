export interface Position {
  x: number
  y: number
}

export type Gender = 'male' | 'female' | 'unspecified'

export type IntentType = 'idle' | 'wander' | 'seek_resident'

export interface Intent {
  type: IntentType
  reason: string
  target: Position
  targetResidentId?: string
  startedAt: number // Date.now() when intent was chosen
  duration: number // ms this intent should last before re-deciding
}

export interface Traits {
  sociability: number // 0-1, higher = more likely to seek other residents
  energy: number // 0-1, higher = shorter idle periods, faster movement
}

export const FOOD_CATALOG = [
  'pizza',
  'sushi',
  'ramen',
  'curry',
  'tacos',
  'burgers',
  'salad',
  'ice cream',
  'chocolate',
  'spicy food',
  'seafood',
  'natto',
  'durian',
  'cheese',
  'pickles',
  'mushrooms',
  'tofu',
  'dumplings',
  'pasta',
  'barbecue',
] as const

export interface Resident {
  id: string
  owner_id: string // auth user who created this resident
  name: string
  color: string
  photo_url?: string | null // user's uploaded photo, if available
  gender: Gender
  likes: string[]
  dislikes: string[]
  mood: string
  ai_reason?: string | null // AI-generated reason from last tick
  ai_reason_set_at?: string | null // timestamp of when ai_reason was set
  position: Position
  intent: Intent
  traits: Traits
}

export interface Memory {
  id: string
  resident_id: string
  content: string
  created_at: string
}

export interface Topic {
  id: string
  resident_id: string
  submitted_by: string
  topic_text: string
  used: boolean
  created_at: string
}

export const ROOM_BOUNDS = { width: 800, height: 500 }
export const AVATAR_SIZE = 48 // px diameter
export const AVATAR_RADIUS = AVATAR_SIZE / 2 // 24
export const MIN_DISTANCE = AVATAR_SIZE // sum of two radii — circles must stay this far apart
export const SOCIAL_DISTANCE = AVATAR_SIZE * 1.5 // desired gap when "hanging out" with someone
export const ARRIVAL_THRESHOLD = 4 // px — close enough to target counts as "arrived"

export function speedFor(traits: Traits): number {
  // px per second
  return 30 + traits.energy * 60
}
