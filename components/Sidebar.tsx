'use client'

import { useState, useEffect, useRef } from 'react'
import { Destination, Place, Visit, FriendPlace } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { mapFriendNoteRpcRow } from '@/lib/friendNotes'
import { getPinState, sortVisitsReverseChronological } from '@/lib/mapUtils'
import type { FriendLocationSidebarPreview } from '@/lib/friendCountryGroups'
import { useUser } from '@/lib/UserContext'
import PlaceNoteInput from '@/components/PlaceNoteInput'
import PlaceNoteCard from '@/components/PlaceNoteCard'
import VisitCard from '@/components/VisitCard'
import AddVisitForm from '@/components/AddVisitForm'
import FriendPlaceNoteRow from '@/components/FriendPlaceNoteRow'

interface SidebarProps {
  destination: Destination | null
  friendPreview: FriendLocationSidebarPreview | null
  onClose: () => void
  onDestinationUpdate: (dest: Destination) => void
  onDestinationDelete: (destId: string) => void
  /** Called after inserting the viewer's destination from a friend-location preview. */
  onFriendPreviewCommitted: (
    dest: Destination,
    opts?: { openAddVisit?: boolean; openAddPlace?: boolean }
  ) => void
  /** Parent clears these flags after Sidebar applies them (survives key change on preview → destination). */
  initialExpandAddVisit?: boolean
  initialExpandAddPlace?: boolean
  onConsumedInitialExpand?: () => void
  nextUpCount: number
}

export default function Sidebar({
  destination,
  friendPreview,
  onClose,
  onDestinationUpdate,
  onDestinationDelete,
  onFriendPreviewCommitted,
  initialExpandAddVisit = false,
  initialExpandAddPlace = false,
  onConsumedInitialExpand,
  nextUpCount,
}: SidebarProps) {
  const { user } = useUser()
  const [visits, setVisits] = useState<Visit[]>(() =>
    sortVisitsReverseChronological(destination?.visits ?? [])
  )
  const [placeNotes, setPlaceNotes] = useState<Place[]>([])
  const [friendNotes, setFriendNotes] = useState<FriendPlace[]>([])
  const [friendNotesLoading, setFriendNotesLoading] = useState(false)
  const [overflowOpen, setOverflowOpen] = useState(false)
  const [deleteConfirmInMenu, setDeleteConfirmInMenu] = useState(false)
  const overflowRef = useRef<HTMLDivElement>(null)
  const [showAddVisit, setShowAddVisit] = useState(false)
  const [showAddPlace, setShowAddPlace] = useState(false)

  useEffect(() => {
    setVisits(sortVisitsReverseChronological(destination?.visits ?? []))
  }, [destination])

  useEffect(() => {
    setOverflowOpen(false)
    setDeleteConfirmInMenu(false)
    setShowAddVisit(false)
    setShowAddPlace(false)
  }, [destination?.id, friendPreview?.groupKey])

  useEffect(() => {
    if (!overflowOpen) setDeleteConfirmInMenu(false)
  }, [overflowOpen])

  useEffect(() => {
    if (!overflowOpen) return
    function handlePointerDown(e: MouseEvent) {
      if (overflowRef.current?.contains(e.target as Node)) return
      setOverflowOpen(false)
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOverflowOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [overflowOpen])

  useEffect(() => {
    if (!initialExpandAddVisit && !initialExpandAddPlace) return
    if (initialExpandAddVisit) setShowAddVisit(true)
    if (initialExpandAddPlace) setShowAddPlace(true)
    onConsumedInitialExpand?.()
  }, [initialExpandAddVisit, initialExpandAddPlace, onConsumedInitialExpand])

  // ── Own place notes ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!destination || !user || friendPreview) return
    let cancelled = false
    async function fetchNotes() {
      const { data } = await supabase
        .from('places')
        .select('*')
        .eq('destination_id', destination!.id)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
      if (!cancelled && data) setPlaceNotes(data)
    }
    fetchNotes()
    return () => { cancelled = true }
  }, [destination, user, friendPreview])

  useEffect(() => {
    if (!destination && !friendPreview) setPlaceNotes([])
  }, [destination, friendPreview])

  // ── Friend notes ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return
    if (!destination && !friendPreview) return
    let cancelled = false

    const p_name = destination?.name ?? friendPreview!.name
    const p_place_id = destination?.place_id ?? friendPreview?.placeId ?? null
    const p_country_code = destination?.country_code ?? friendPreview?.countryCode ?? null

    async function fetchFriendNotes() {
      setFriendNotesLoading(true)
      try {
        const { data } = await supabase.rpc('get_friend_notes', {
          p_user_id: user!.id,
          p_place_id: p_place_id ?? null,
          p_name,
          p_country_code: p_country_code ?? null,
        })

        if (cancelled) return

        if (!data?.length) {
          setFriendNotes([])
          return
        }

        setFriendNotes(data.map(mapFriendNoteRpcRow))
      } finally {
        if (!cancelled) setFriendNotesLoading(false)
      }
    }

    setFriendNotes([])
    fetchFriendNotes()
    return () => { cancelled = true }
  }, [user, destination, friendPreview])

  if (!destination && !friendPreview) return null

  const title = destination?.name ?? friendPreview!.name
  const subtitleCountry = destination?.country_name ?? friendPreview?.countryName

  async function insertViewerDestination(nextUp: boolean): Promise<Destination | null> {
    if (!user || !friendPreview) return null
    const { data, error } = await supabase
      .from('destinations')
      .insert({
        user_id: user.id,
        name: friendPreview.name,
        place_id: friendPreview.placeId ?? null,
        lat: friendPreview.lat,
        lng: friendPreview.lng,
        country_code: friendPreview.countryCode,
        country_name: friendPreview.countryName ?? null,
        continent: friendPreview.continent ?? null,
        next_up: nextUp,
        next_up_year: null,
      })
      .select()
      .single()
    if (error || !data) return null
    return { ...data, visits: [] }
  }

  async function handleNextUpToggle() {
    if (friendPreview) {
      if (nextUpCount >= 5) return
      const d = await insertViewerDestination(true)
      if (d) onFriendPreviewCommitted(d)
      return
    }

    if (!destination) return

    const newNextUp = !destination.next_up

    if (newNextUp && nextUpCount >= 5) return

    if (!newNextUp && visits.length === 0) {
      await supabase.from('destinations').delete().eq('id', destination.id)
      onDestinationDelete(destination.id)
      onClose()
      return
    }

    const { data } = await supabase
      .from('destinations')
      .update({ next_up: newNextUp, next_up_year: newNextUp ? destination.next_up_year : null })
      .eq('id', destination.id)
      .select()
      .single()
    if (data) onDestinationUpdate({ ...data, visits })
  }

  async function handleNextUpYearBlur(value: string) {
    if (!destination) return
    const parsed = value ? parseInt(value, 10) : null
    const { data } = await supabase
      .from('destinations')
      .update({ next_up_year: parsed })
      .eq('id', destination.id)
      .select()
      .single()
    if (data) onDestinationUpdate({ ...data, visits })
  }

  async function handleAddVisitClick() {
    if (friendPreview) {
      const d = await insertViewerDestination(false)
      if (!d) return
      onFriendPreviewCommitted(d, { openAddVisit: true })
      return
    }
    setShowAddVisit(true)
  }

  async function handleAddPlaceClick() {
    if (friendPreview) {
      const d = await insertViewerDestination(false)
      if (!d) return
      onFriendPreviewCommitted(d, { openAddPlace: true })
      return
    }
    setShowAddPlace(true)
  }

  function handleVisitChange(updated: Visit) {
    if (!destination) return
    const newVisits = sortVisitsReverseChronological(
      visits.map((v) => (v.id === updated.id ? updated : v))
    )
    setVisits(newVisits)
    onDestinationUpdate({ ...destination, visits: newVisits })
  }

  function handleVisitDelete(visitId: string) {
    if (!destination) return
    const newVisits = sortVisitsReverseChronological(visits.filter((v) => v.id !== visitId))
    setVisits(newVisits)
    onDestinationUpdate({ ...destination, visits: newVisits })
  }

  function handleAddVisitSave(visit: Visit) {
    if (!destination) return
    const newVisits = sortVisitsReverseChronological([...visits, visit])
    setVisits(newVisits)
    onDestinationUpdate({ ...destination, visits: newVisits })
    setShowAddVisit(false)
  }

  function handleNoteChange(updated: Place) {
    setPlaceNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
  }

  function handleNoteDelete(noteId: string) {
    setPlaceNotes((prev) => prev.filter((n) => n.id !== noteId))
  }

  function handleNoteSaved(note: Place) {
    setPlaceNotes((prev) => [note, ...prev])
    setShowAddPlace(false)
  }

  async function handleDeleteDestination() {
    if (!destination) return
    await supabase.from('destinations').delete().eq('id', destination.id)
    onDestinationDelete(destination.id)
    onClose()
  }

  const nextUpActive = Boolean(destination?.next_up)
  const nextUpDisabled = friendPreview
    ? nextUpCount >= 5
    : !destination!.next_up && nextUpCount >= 5

  const showDeleteControls =
    Boolean(destination) &&
    !friendPreview &&
    (visits.length > 0 ||
      destination!.next_up ||
      placeNotes.length > 0 ||
      getPinState(destination!) === 'hidden')

  const friendsSection = (
    <div className="mt-6 pt-5 border-t border-gray-100">
      <p className="text-[11px] font-medium text-gray-300 mb-3">
        Friends who&rsquo;ve been here
      </p>

      {friendNotesLoading ? (
        <p className="text-sm text-gray-400">Loading&hellip;</p>
      ) : friendNotes.length === 0 ? (
        <p className="text-sm text-gray-400">No notes from friends yet.</p>
      ) : (
        <div className="space-y-5">
          {friendNotes.map((fn) => (
            <FriendPlaceNoteRow key={fn.id} note={fn} />
          ))}
        </div>
      )}
    </div>
  )

  const historySection = (
    <div className="mt-6">
      <p className="text-[11px] font-medium text-gray-300 mb-3">History</p>

      {visits.length === 0 && (
        <p className="text-sm text-gray-400 italic">No visits logged yet.</p>
      )}

      <div className="space-y-2">
        {visits.map((visit) => (
          <VisitCard
            key={visit.id}
            visit={visit}
            onChange={handleVisitChange}
            onDelete={handleVisitDelete}
          />
        ))}
      </div>

      {destination && showAddVisit ? (
        <AddVisitForm
          destinationId={destination.id}
          onSave={handleAddVisitSave}
          onCancel={() => setShowAddVisit(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => void handleAddVisitClick()}
          className="mt-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          + Add visit
        </button>
      )}
    </div>
  )

  const placesSection = (
    <div className="mt-6">
      <p className="text-[11px] font-medium text-gray-300 mb-3">Places</p>

      {placeNotes.length === 0 && !showAddPlace && (
        <p className="text-sm text-gray-400 italic">No places noted yet.</p>
      )}

      <div className="space-y-1">
        {placeNotes.map((note) => (
          <PlaceNoteCard
            key={note.id}
            note={note}
            onChange={handleNoteChange}
            onDelete={handleNoteDelete}
          />
        ))}
      </div>

      {destination && showAddPlace ? (
        <PlaceNoteInput
          destinationId={destination.id}
          countryCode={destination.country_code ?? ''}
          onSave={handleNoteSaved}
          onCancel={() => setShowAddPlace(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => void handleAddPlaceClick()}
          className="mt-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          + Add place
        </button>
      )}
    </div>
  )

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />

      <aside className="fixed z-40 bg-white shadow-2xl overflow-y-auto bottom-0 left-0 right-0 h-[70dvh] rounded-t-2xl animate-slide-up md:top-0 md:right-0 md:left-auto md:bottom-auto md:h-full md:w-full md:max-w-md md:rounded-t-none md:rounded-l-2xl md:animate-slide-right">
        <div className="absolute top-4 right-4 flex items-center gap-0.5">
          {showDeleteControls && (
            <div ref={overflowRef} className="relative">
              <button
                type="button"
                onClick={() => setOverflowOpen((o) => !o)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                aria-expanded={overflowOpen}
                aria-haspopup="menu"
                aria-label="Destination options"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <circle cx={12} cy={5} r={2} />
                  <circle cx={12} cy={12} r={2} />
                  <circle cx={12} cy={19} r={2} />
                </svg>
              </button>
              {overflowOpen && (
                <div
                  className="absolute right-0 top-full z-50 mt-1 min-w-[220px] rounded-lg border border-gray-100 bg-white py-1 shadow-lg"
                  role="menu"
                >
                  {!deleteConfirmInMenu ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => setDeleteConfirmInMenu(true)}
                      className="flex w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Delete destination
                    </button>
                  ) : (
                    <div className="px-3 py-2">
                      <p className="text-xs text-gray-500 leading-snug mb-3">
                        Permanently remove this destination? This cannot be undone.
                      </p>
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => void handleDeleteDestination()}
                          className="w-full rounded-md bg-red-500 py-2 text-sm text-white hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmInMenu(false)}
                          className="w-full rounded-md border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 text-xl transition-colors"
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>

        <div className="p-6 pt-8">
          <h2
            className={`text-2xl font-bold tracking-tight text-gray-900 ${showDeleteControls ? 'pr-20' : 'pr-8'}`}
          >
            {title}
          </h2>
          {subtitleCountry && subtitleCountry !== title && (
            <p className="mt-1.5 text-xs font-normal text-gray-400">{subtitleCountry}</p>
          )}

          {friendPreview && (
            <p className="mt-3 text-xs text-gray-500 leading-relaxed bg-amber-50/80 border border-amber-100 rounded-lg px-3 py-2">
              Not on your map yet. Add a visit, a place note, or toggle Next Up to save this spot.
            </p>
          )}

          <div className="mt-4 flex items-center gap-2 pb-5">
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => void handleNextUpToggle()}
                disabled={nextUpDisabled}
                aria-describedby="next-up-slots-meta"
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  nextUpActive ? 'bg-[#7C3AED]' : 'bg-gray-200'
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    nextUpActive ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </button>
              <span
                id="next-up-slots-meta"
                className="absolute top-full left-1/2 mt-1 -translate-x-1/2 text-[11px] tabular-nums text-gray-400 whitespace-nowrap text-center"
              >
                {nextUpCount}/5
              </span>
            </div>
            <span className="text-sm text-gray-600">Next up</span>
            {destination?.next_up && (
              <input
                type="number"
                defaultValue={destination.next_up_year ?? ''}
                onBlur={(e) => handleNextUpYearBlur(e.target.value)}
                placeholder="Year"
                min={1900}
                max={2100}
                className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
              />
            )}
          </div>

          {friendPreview ? (
            <>
              {friendsSection}
              {historySection}
              {placesSection}
            </>
          ) : (
            <>
              {historySection}
              {placesSection}
              {friendsSection}
            </>
          )}
        </div>
      </aside>
    </>
  )
}
