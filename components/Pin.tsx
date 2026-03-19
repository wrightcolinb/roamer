'use client'

import type { PinState } from '@/lib/types'

interface PinProps {
  state: PinState
  hasIntent?: boolean
}

const SIZE = 28

function VisitedPin() {
  return (
    <svg width={SIZE} height={SIZE} viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="10" fill="#E8735A" />
    </svg>
  )
}

const HOUSE_PATH =
  'M14 2.5c-.5 0-1 .2-1.3.6L3.4 12.8c-.6.7-.1 1.7.8 1.7H6v8c0 1.4 1.1 2.5 2.5 2.5h11c1.4 0 2.5-1.1 2.5-2.5v-8h1.8c.9 0 1.4-1 .8-1.7L15.3 3.1c-.3-.4-.8-.6-1.3-.6z'

function LivedPin() {
  return (
    <svg width={SIZE} height={SIZE} viewBox="0 0 28 28">
      <path d={HOUSE_PATH} fill="#2D6A4F" />
    </svg>
  )
}

const STAR_PATH =
  'M14 2.5c.4 0 .7.2.9.6l2.8 5.9 6.3.9c.8.1 1.1 1.1.5 1.7l-4.6 4.5 1.1 6.3c.1.8-.7 1.4-1.4 1l-5.6-3-5.6 3c-.7.4-1.5-.2-1.4-1l1.1-6.3-4.6-4.5c-.6-.6-.3-1.6.5-1.7l6.3-.9 2.8-5.9c.2-.4.5-.6.9-.6z'

function OnMyListPin() {
  return (
    <svg width={SIZE} height={SIZE} viewBox="0 0 28 28">
      <path d={STAR_PATH} fill="#C4A8D8" />
    </svg>
  )
}

function PlanningPin() {
  const S = SIZE + 8
  return (
    <svg width={S} height={S} viewBox="0 0 36 36">
      <g transform="translate(4,4)">
        <path d={STAR_PATH} fill="#7B2FF7" />
      </g>
      {/* Sparkle accents */}
      <line x1="8" y1="4" x2="6" y2="1" stroke="#7B2FF7" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="28" y1="4" x2="30" y2="1" stroke="#7B2FF7" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="3" y1="16" x2="0" y2="17" stroke="#7B2FF7" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="33" y1="16" x2="36" y2="17" stroke="#7B2FF7" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="18" y1="33" x2="18" y2="36" stroke="#7B2FF7" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

function IntentIndicator() {
  return (
    <circle cx="22" cy="6" r="4" fill="#7B2FF7" stroke="white" strokeWidth="1.5" />
  )
}

const PIN_COMPONENTS: Record<PinState, () => JSX.Element> = {
  visited: VisitedPin,
  lived: LivedPin,
  'on my list': OnMyListPin,
  planning: PlanningPin,
}

export default function Pin({ state, hasIntent }: PinProps) {
  const PinShape = PIN_COMPONENTS[state]

  if (hasIntent && (state === 'visited' || state === 'lived')) {
    return (
      <svg width={SIZE} height={SIZE} viewBox="0 0 28 28" className="cursor-pointer">
        {state === 'visited' && <circle cx="14" cy="14" r="10" fill="#E8735A" />}
        {state === 'lived' && <path d={HOUSE_PATH} fill="#2D6A4F" />}
        <IntentIndicator />
      </svg>
    )
  }

  return (
    <div className="cursor-pointer">
      <PinShape />
    </div>
  )
}
