import { Resident, Intent, Position, ROOM_BOUNDS, AVATAR_SIZE, AVATAR_RADIUS, SOCIAL_DISTANCE, MIN_DISTANCE } from './types'

export function hasRecentAIReason(resident: Resident): boolean {
  if (!resident.ai_reason || !resident.ai_reason_set_at) {
    return false
  }
  const aiReasonTime = new Date(resident.ai_reason_set_at).getTime()
  const intentStartTime = resident.intent.startedAt
  return aiReasonTime > intentStartTime
}

export function clampToRoom(pos: Position): Position {
  return {
    x: Math.min(Math.max(pos.x, AVATAR_RADIUS), ROOM_BOUNDS.width - AVATAR_RADIUS),
    y: Math.min(Math.max(pos.y, AVATAR_RADIUS), ROOM_BOUNDS.height - AVATAR_RADIUS),
  }
}

export function resolveCollisions(residents: Resident[]): void {
  for (let i = 0; i < residents.length; i++) {
    for (let j = i + 1; j < residents.length; j++) {
      const a = residents[i]
      const b = residents[j]

      let dx = b.position.x - a.position.x
      let dy = b.position.y - a.position.y
      let distance = Math.sqrt(dx * dx + dy * dy)

      // Handle zero distance (overlapping at same point)
      if (distance === 0) {
        dx = 0.01
        dy = 0.01
        distance = Math.sqrt(dx * dx + dy * dy)
      }

      if (distance < MIN_DISTANCE) {
        const overlap = MIN_DISTANCE - distance
        const nx = dx / distance
        const ny = dy / distance

        a.position.x -= (nx * overlap) / 2
        a.position.y -= (ny * overlap) / 2
        b.position.x += (nx * overlap) / 2
        b.position.y += (ny * overlap) / 2

        a.position = clampToRoom(a.position)
        b.position = clampToRoom(b.position)
      }
    }
  }
}

export function randomPointInRoom(): Position {
  const margin = AVATAR_SIZE / 2
  return {
    x: Math.random() * (ROOM_BOUNDS.width - margin * 2) + margin,
    y: Math.random() * (ROOM_BOUNDS.height - margin * 2) + margin,
  }
}

export function decideNextIntent(
  resident: Resident,
  allResidents: Resident[],
  now: number
): Intent {
  const roll = Math.random()
  const seekThreshold = resident.traits.sociability * 0.5 // Seek if roll < sociability * 0.5

  // Seek resident
  if (roll < seekThreshold && allResidents.length > 1) {
    const others = allResidents.filter((r) => r.id !== resident.id)
    const targetResident = others[Math.floor(Math.random() * others.length)]

    const energyFactor = 1 + resident.traits.energy
    const duration = (4000 + Math.random() * 4000) / energyFactor

    // Compute a point at SOCIAL_DISTANCE from the target resident at a random angle
    const angle = Math.random() * Math.PI * 2
    let target: Position = {
      x: targetResident.position.x + Math.cos(angle) * SOCIAL_DISTANCE,
      y: targetResident.position.y + Math.sin(angle) * SOCIAL_DISTANCE,
    }
    target = clampToRoom(target)

    return {
      type: 'seek_resident',
      reason: `wants to hang out with ${targetResident.name}`,
      target,
      targetResidentId: targetResident.id,
      startedAt: now,
      duration,
    }
  }

  // Wander or idle
  const wanderThreshold = seekThreshold + resident.traits.energy * 0.3 // 30% of energy scale

  if (roll < wanderThreshold) {
    // Wander
    const reasons = [
      'feels like wandering around',
      'is exploring a bit',
      "wants to stretch their legs",
      'is looking for something to do',
    ]
    const reason = reasons[Math.floor(Math.random() * reasons.length)]

    return {
      type: 'wander',
      reason,
      target: clampToRoom(randomPointInRoom()),
      startedAt: now,
      duration: 3000 + Math.random() * 3000,
    }
  }

  // Idle
  const idleReasons = [
    'is taking a break',
    'is daydreaming',
    'is just vibing',
    'is people-watching',
  ]
  const idleReason = hasRecentAIReason(resident) ? resident.ai_reason : idleReasons[Math.floor(Math.random() * idleReasons.length)]

  return {
    type: 'idle',
    reason: idleReason!,
    target: { ...resident.position },
    startedAt: now,
    duration: 2000 + Math.random() * 3000,
  }
}
