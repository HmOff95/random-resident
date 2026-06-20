import { TickResidentInput } from './types'

export function buildTickPrompt(residents: TickResidentInput[]): string {
  return `You control the inner lives of ${residents.length} simulated characters in a cozy life-sim game, similar in tone to Tomodachi Life. For each character below, decide what they're doing right now and write ONE short status line (under 12 words, casual, third-person, like "is debating whether pineapple belongs on pizza").

If a character has pending topics, they should react to/think about ONE of those topics in their status line and optionally form a new memory about it. If a character has no pending topics, give them a plausible idle/social status line based on their personality and mood — keep it light and varied.

A character's likes/dislikes should influence their reaction if a topic relates to food. Sociability affects how social their status line is (high = mentions others, low = solo activity). Energy affects tone (high = excited/active, low = mellow/relaxed).

Only set newMemory if something notable happened this tick (e.g. discussed a topic, had a strong reaction) — otherwise use null. Only set newMood if their mood should shift — otherwise use null. Keep moods to a single word or short phrase (e.g. "happy", "annoyed", "curious", "content").

Characters:
${JSON.stringify(residents, null, 2)}

Respond ONLY with valid JSON matching this exact shape, no other text, no markdown code fences:
{"results": [{"id": "...", "reason": "...", "newMemory": "..." | null, "newMood": "..." | null}]}`
}
