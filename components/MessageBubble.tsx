'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { MESSAGE_BUBBLE_TTL } from '@/lib/types'
import { ChatMessage } from '@/lib/chatStore'

interface MessageBubbleProps {
  message: ChatMessage
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [isVisible, setIsVisible] = useState(true)

  // Fade out the bubble after MESSAGE_BUBBLE_TTL ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, MESSAGE_BUBBLE_TTL)

    return () => clearTimeout(timer)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 1, scale: 0.8 }}
      animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.8 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute pointer-events-none z-20"
      style={{
        left: `${message.x}px`,
        top: `${message.y - 60}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <div
        className="rounded-2xl rounded-bl-none px-3 py-1.5 text-xs text-white font-semibold shadow-resident break-words max-w-[160px]"
        style={{ backgroundColor: message.display_color }}
      >
        {message.content}
      </div>
    </motion.div>
  )
}
