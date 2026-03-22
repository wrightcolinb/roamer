'use client'

import { Destination } from '@/lib/types'
import {
  FriendLocationGroup,
  friendGroupToSidebarPreview,
  type FriendLocationSidebarPreview,
} from '@/lib/friendCountryGroups'
import { FriendAvatar } from '@/components/FriendPlaceNoteRow'

interface FriendCountryLocationGroupProps {
  group: FriendLocationGroup
  matchedDestination: Destination | null
  onOpenDestination: (dest: Destination) => void
  onOpenFriendPreview: (preview: FriendLocationSidebarPreview) => void
}

export default function FriendCountryLocationGroup({
  group,
  matchedDestination,
  onOpenDestination,
  onOpenFriendPreview,
}: FriendCountryLocationGroupProps) {
  const count = group.totalFriendNotes

  function handleOpenLocation() {
    if (matchedDestination) onOpenDestination(matchedDestination)
    else onOpenFriendPreview(friendGroupToSidebarPreview(group))
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/80 overflow-hidden">
      <button
        type="button"
        onClick={handleOpenLocation}
        className="w-full text-left px-3 py-3 flex items-start gap-2.5 transition-colors hover:bg-gray-100 cursor-pointer"
      >
        <span className="text-base leading-none shrink-0 mt-0.5" aria-hidden>
          📍
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
            <span className="text-sm font-semibold text-gray-900">{group.destinationName}</span>
            <span className="text-xs text-gray-500 tabular-nums">
              {count === 0
                ? 'No friend tips yet'
                : `${count} friend ${count === 1 ? 'tip' : 'tips'}`}
            </span>
          </div>
          {!matchedDestination && (
            <p className="text-xs text-gray-400 mt-1 leading-snug">
              Open to see friend tips — add a visit or Next Up to put it on your map.
            </p>
          )}
        </div>
      </button>

      <div className="px-3 pb-3 pt-0">
        <div className="border-t border-gray-200/80 pt-3 space-y-3 pl-1">
          {group.friends.map((f) => (
            <div key={f.authorId} className="flex gap-2.5 items-start">
              <FriendAvatar displayName={f.displayName} seed={f.authorId} />
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-medium text-gray-800">{f.displayName}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                  {f.visitLabel ?? 'Shared tips'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
