'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '@/lib/chatStore'
import { supabase } from '@/lib/supabase/client'
import { PROXIMITY_THRESHOLD } from '@/lib/types'

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
  user: { id: string; displayName: string; displayColor: string }
  myCursorX: number
  myCursorY: number
}

export default function ChatPanel({
  isOpen,
  onClose,
  user,
  myCursorX,
  myCursorY,
}: ChatPanelProps) {
  const { messages } = useChatStore()
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const nearbyMessages = messages.filter((m) => m.isNearby)

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isSending) return
    setIsSending(true)
    setInput('')

    await supabase.from('messages').insert({
      user_id: user.id,
      display_name: user.displayName,
      display_color: user.displayColor,
      content: text,
      x: myCursorX,
      y: myCursorY,
    })
    setIsSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-brown/20 backdrop-blur-sm z-40 md:hidden"
          />

          {/* Panel - Mobile: bottom sheet, Desktop: floating widget */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 md:bottom-4 md:right-4 md:left-auto md:top-auto z-50 md:w-96 md:h-96 bg-white-warm rounded-t-2xl md:rounded-2xl shadow-warm flex flex-col md:flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-coral text-white p-4 flex items-center justify-between flex-shrink-0 border-b border-sand">
              <div>
                <h3 className="font-extrabold text-base">Nearby Chat</h3>
                <p className="text-brown-light text-xs">within {PROXIMITY_THRESHOLD}px</p>
              </div>

              <button
                onClick={onClose}
                className="text-brown-light hover:text-brown font-bold"
              >
                ✕
              </button>
            </div>

            {/* Message log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {nearbyMessages.length === 0 ? (
                <div className="text-center text-brown-light text-sm py-8">
                  No nearby messages yet. Move your cursor near others to see their chat.
                </div>
              ) : (
                nearbyMessages.map((msg) => (
                  <div key={msg.id} className="flex gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex-shrink-0 border border-white-warm"
                      style={{ backgroundColor: msg.display_color }}
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-xs text-brown-light mb-0.5">
                        {msg.display_name}
                      </div>
                      <div
                        className="text-sm text-white rounded-2xl rounded-tl-none px-3 py-1.5 break-words max-w-xs inline-block"
                        style={{ backgroundColor: msg.display_color }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-sand p-3 flex gap-2 flex-shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Say something nearby..."
                maxLength={200}
                className="flex-1 rounded-full border border-sand focus:border-coral bg-cream text-brown placeholder:text-brown-light px-3 py-2 text-sm outline-none focus:outline-none transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={isSending || !input.trim()}
                className="rounded-full bg-coral hover:bg-coral-dark disabled:opacity-40 text-white px-4 py-2 text-sm font-bold shadow-coral transition-colors"
              >
                Send
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
