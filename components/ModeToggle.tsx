'use client'

import { MapMode } from '@/lib/types'

interface ModeToggleProps {
  mode: MapMode
  onToggle: () => void
}

function BrushIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34a.996.996 0 00-1.41 0L9 12.25 11.75 15l8.96-8.96a.996.996 0 000-1.41z" />
    </svg>
  )
}

function CompassIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z" />
    </svg>
  )
}

export default function ModeToggle({ mode, onToggle }: ModeToggleProps) {
  const isFillMode = mode === 'fill'

  return (
    <button
      onClick={onToggle}
      className={`
        fixed bottom-8 right-6 z-10
        px-4 py-2.5 rounded-xl shadow-lg
        font-medium text-sm
        flex items-center gap-2
        transition-all duration-200
        cursor-pointer
        ${isFillMode
          ? 'bg-[#E8735A] text-white hover:bg-[#d4654e]'
          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
        }
      `}
    >
      {isFillMode ? <BrushIcon /> : <CompassIcon />}
      {isFillMode ? 'Country Fill Mode' : 'Explore Mode'}
    </button>
  )
}
