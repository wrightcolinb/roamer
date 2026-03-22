'use client'

import { FriendPlaceNote } from '@/lib/types'
import { SENTIMENT_QUOTE_COLORS } from '@/lib/mapUtils'

function hashStringToHue(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % 360
}

function formatFriendYear(note: FriendPlaceNote): string | null {
  if (note.visit_year != null) return String(note.visit_year)
  if (note.created_at) {
    const y = new Date(note.created_at).getFullYear()
    if (!Number.isNaN(y)) return String(y)
  }
  return null
}

export function FriendAvatar({ displayName, seed }: { displayName: string; seed: string }) {
  const initial = displayName.trim().charAt(0).toUpperCase() || '?'
  const hue = hashStringToHue(seed)
  return (
    <div
      className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shadow-sm"
      style={{ backgroundColor: `hsl(${hue} 42% 40%)` }}
      aria-hidden
    >
      {initial}
    </div>
  )
}

interface FriendPlaceNoteRowProps {
  note: FriendPlaceNote
}

export default function FriendPlaceNoteRow({ note }: FriendPlaceNoteRowProps) {
  const seed = note.author_id || note.display_name
  const yearLabel = formatFriendYear(note)
  const quoteColor = SENTIMENT_QUOTE_COLORS[note.sentiment]

  return (
    <div className="flex gap-3 items-start">
      <FriendAvatar displayName={note.display_name} seed={seed} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
          <p className="text-sm font-semibold text-gray-900">{note.display_name}</p>
          {yearLabel && (
            <span className="text-xs font-normal text-gray-400 tabular-nums">{yearLabel}</span>
          )}
        </div>
        <p className="text-[14px] font-medium text-gray-800 leading-snug mt-1 flex gap-2 items-start">
          <span className="text-base leading-none shrink-0 mt-0.5" aria-hidden>
            {note.category_emoji || '📍'}
          </span>
          <span>{note.place_name}</span>
        </p>
        {note.note && (
          <p className="text-[13px] italic leading-snug mt-0.5" style={{ color: quoteColor }}>
            &ldquo;{note.note}&rdquo;
          </p>
        )}
      </div>
    </div>
  )
}
