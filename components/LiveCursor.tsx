'use client'

interface LiveCursorProps {
  x: number
  y: number
  name: string
  color: string
}

export default function LiveCursor({ x, y, name, color }: LiveCursorProps) {
  return (
    <div
      className="fixed pointer-events-none z-20 flex items-center gap-1"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(0, 0)',
      }}
    >
      <svg
        width="16"
        height="20"
        viewBox="0 0 16 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1 1L1 19L4 15L8 20L10 19L6 14L15 14V1L1 1Z"
          fill={color}
          stroke="white"
          strokeWidth="0.5"
        />
      </svg>

      <div
        className="px-2 py-0.5 rounded-full text-xs font-bold text-white whitespace-nowrap shadow-warm"
        style={{
          backgroundColor: color,
        }}
      >
        {name}
      </div>
    </div>
  )
}
