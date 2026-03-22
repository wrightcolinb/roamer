'use client'

import { Destination } from '@/lib/types'
import { getPinState } from '@/lib/mapUtils'

const VISITED_COLOR = '#E8735A'
const LIVED_COLOR = '#2D6A4F'
const NEXT_UP_COLOR = '#7C3AED'
const PIN_SIZE = 20

interface DestinationPinProps {
  destination: Destination
}

function VisitedPin() {
  return (
    <svg width={PIN_SIZE} height={PIN_SIZE} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" fill={VISITED_COLOR} stroke="#fff" strokeWidth="2" />
    </svg>
  )
}

function LivedPin() {
  return (
    <svg width={PIN_SIZE} height={PIN_SIZE} viewBox="0 0 24 24">
      <path
        d="M12 3L4 11h2.5v7h11v-7H20L12 3z"
        fill={LIVED_COLOR}
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function NextUpPin() {
  return (
    <svg width={PIN_SIZE} height={PIN_SIZE} viewBox="0 0 24 24">
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill={NEXT_UP_COLOR}
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function DestinationPin({ destination }: DestinationPinProps) {
  switch (getPinState(destination)) {
    case 'visited':
      return <VisitedPin />
    case 'lived':
      return <LivedPin />
    case 'next_up':
      return <NextUpPin />
    case 'hidden':
      return null
  }
}
