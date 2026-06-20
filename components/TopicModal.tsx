'use client'

import { useState, FormEvent } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useTopicsStore } from '@/lib/topicsStore'

interface TopicModalProps {
  residentId: string
  residentName: string
  userId: string
  onClose: () => void
}

export default function TopicModal({ residentId, residentName, userId, onClose }: TopicModalProps) {
  const [topicText, setTopicText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [confirmation, setConfirmation] = useState(false)
  const { addTopic } = useTopicsStore()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!topicText.trim()) return

    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from('topics')
        .insert({
          resident_id: residentId,
          submitted_by: userId,
          topic_text: topicText,
        })
        .select()
        .single()

      if (error) throw error

      addTopic(data)
      setConfirmation(true)
      setTopicText('')

      // Close modal after showing confirmation
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      console.error('Failed to submit topic:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-96 rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold">Talk to {residentName}</h2>

        {confirmation ? (
          <div className="text-center">
            <p className="text-lg font-semibold text-green-600">
              ✓ {residentName} will hear about it
            </p>
            <p className="mt-2 text-sm text-gray-600">Topic queued for discussion</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <textarea
              value={topicText}
              onChange={(e) => setTopicText(e.target.value.slice(0, 100))}
              placeholder="What should they talk about?"
              maxLength={100}
              className="mb-2 w-full rounded border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
            <div className="mb-4 text-xs text-gray-500">
              {topicText.length}/100 characters
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded bg-gray-300 px-4 py-2 font-semibold hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!topicText.trim() || isLoading}
                className="flex-1 rounded bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600 disabled:bg-gray-400"
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
