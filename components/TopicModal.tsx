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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brown/20 backdrop-blur-sm">
      <div className="w-full mx-4 sm:mx-0 max-w-md rounded-2xl bg-white-warm p-6 shadow-warm">
        <h2 className="mb-2 text-lg font-extrabold text-brown">Talk to {residentName}</h2>
        <p className="mb-4 text-brown-light text-sm">What should they hear about?</p>

        {confirmation ? (
          <div className="text-center">
            <p className="text-base font-bold text-mint">
              ✓ {residentName} will hear about it
            </p>
            <p className="mt-2 text-sm text-brown-light">Topic queued for discussion</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <textarea
              value={topicText}
              onChange={(e) => setTopicText(e.target.value.slice(0, 100))}
              placeholder="What should they talk about?"
              maxLength={100}
              className="mb-2 w-full rounded-xl border border-sand p-3 text-sm bg-cream text-brown placeholder:text-brown-light focus:outline-none focus:border-coral transition-colors resize-none"
              rows={4}
            />
            <div className="mb-4 text-xs text-brown-light text-right">
              {topicText.length}/100 characters
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full px-4 py-2 text-sm font-semibold text-brown-light hover:text-brown transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!topicText.trim() || isLoading}
                className="flex-1 rounded-full bg-coral hover:bg-coral-dark disabled:opacity-40 px-4 py-2 text-sm font-bold text-white shadow-coral transition-colors"
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
