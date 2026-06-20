import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { buildTickPrompt } from '@/lib/tick/buildPrompt'
import { callGroqTick } from '@/lib/tick/groqClient'
import { TickResidentInput } from '@/lib/tick/types'

const BATCH_SIZE = 20
const MAX_MEMORIES = 10

export async function GET(req: NextRequest) {
  // Auth check
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.TICK_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Fetch the oldest-ticked residents, up to BATCH_SIZE
    const { data: residents, error: residentsError } = await supabaseAdmin
      .from('residents')
      .select('*')
      .order('last_ticked_at', { ascending: true })
      .limit(BATCH_SIZE)

    if (residentsError) throw residentsError
    if (!residents || residents.length === 0) {
      return NextResponse.json({ message: 'No residents to process' })
    }

    const residentIds = residents.map((r) => r.id)

    // 2. Fetch recent memories for these residents (up to MAX_MEMORIES each)
    const { data: allMemories, error: memError } = await supabaseAdmin
      .from('memories')
      .select('*')
      .in('resident_id', residentIds)
      .order('created_at', { ascending: false })

    if (memError) throw memError

    const memoriesByResident = new Map<string, string[]>()
    for (const mem of allMemories || []) {
      const list = memoriesByResident.get(mem.resident_id) || []
      if (list.length < MAX_MEMORIES) {
        list.push(mem.content)
      }
      memoriesByResident.set(mem.resident_id, list)
    }

    // 3. Fetch pending topics for these residents
    const { data: topics, error: topicError } = await supabaseAdmin
      .from('topics')
      .select('*')
      .in('resident_id', residentIds)
      .eq('used', false)

    if (topicError) throw topicError

    const topicsByResident = new Map<string, Array<{ id: string; text: string }>>()
    for (const topic of topics || []) {
      const list = topicsByResident.get(topic.resident_id) || []
      list.push({ id: topic.id, text: topic.topic_text })
      topicsByResident.set(topic.resident_id, list)
    }

    // 4. Build tick input
    const allNames = residents.map((r) => r.name)
    const tickInput: TickResidentInput[] = residents.map((r) => ({
      id: r.id,
      name: r.name,
      gender: r.gender,
      sociability: r.sociability,
      energy: r.energy,
      likes: r.likes,
      dislikes: r.dislikes,
      mood: r.mood,
      recentMemories: memoriesByResident.get(r.id) || [],
      nearbyResidentNames: allNames.filter((n) => n !== r.name),
      pendingTopics: (topicsByResident.get(r.id) || []).map((t) => t.text),
    }))

    // 5. Call Groq once for the whole batch
    const prompt = buildTickPrompt(tickInput)
    const tickResult = await callGroqTick(prompt)

    // 6. Write results back
    const now = new Date().toISOString()
    for (const result of tickResult.results) {
      // Update resident: mood (if changed) + last_ticked_at + ai_reason
      const updates: Record<string, string> = { 
        last_ticked_at: now,
        ai_reason: result.reason,
        ai_reason_set_at: now
      }
      if (result.newMood) updates.mood = result.newMood

      await supabaseAdmin.from('residents').update(updates).eq('id', result.id)

      // Insert new memory if present
      if (result.newMemory) {
        await supabaseAdmin.from('memories').insert({
          resident_id: result.id,
          content: result.newMemory,
        })

        // Prune memories beyond MAX_MEMORIES for this resident
        const { data: residentMemories } = await supabaseAdmin
          .from('memories')
          .select('id')
          .eq('resident_id', result.id)
          .order('created_at', { ascending: false })

        if (residentMemories && residentMemories.length > MAX_MEMORIES) {
          const idsToDelete = residentMemories.slice(MAX_MEMORIES).map((m) => m.id)
          await supabaseAdmin.from('memories').delete().in('id', idsToDelete)
        }
      }

      // Mark all pending topics for this resident as used
      const pendingTopicIds = (topicsByResident.get(result.id) || []).map((t) => t.id)
      if (pendingTopicIds.length > 0) {
        await supabaseAdmin
          .from('topics')
          .update({ used: true })
          .in('id', pendingTopicIds)
      }
    }

    return NextResponse.json({
      processed: tickResult.results.length,
      results: tickResult.results,
    })
  } catch (err) {
    console.error('Tick error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown tick error' },
      { status: 500 }
    )
  }
}
