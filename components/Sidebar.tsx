'use client'

import { useState, useEffect } from 'react'
import { Destination, PlaceNote, Visit, FriendPlaceNote } from '@/lib/types'
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
  const [placeNotes, setPlaceNotes] = useState<PlaceNote[]>([])
  const [friendNotes, setFriendNotes] = useState<FriendPlaceNote[]>([])
  const [friendNotesLoading, setFriendNotesLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showAddVisit, setShowAddVisit] = useState(false)
  const [showAddPlace, setShowAddPlace] = useState(false)

  useEffect(() => {
    setVisits(sortVisitsReverseChronological(destination?.visits ?? []))
  }, [destination])

  useEffect(() => {
    setConfirmDelete(false)
    setShowAddVisit(false)
    setShowAddPlace(false)
  }, [destination?.id, friendPreview?.groupKey])

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
        .from('place_notes')
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

  function handleNoteChange(updated: PlaceNote) {
    setPlaceNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
  }

  function handleNoteDelete(noteId: string) {
    setPlaceNotes((prev) => prev.filter((n) => n.id !== noteId))
  }

  function handleNoteSaved(note: PlaceNote) {
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
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
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
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">History</p>

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
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Places</p>

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

      <aside className="fixed z-40 bg-white shadow-2xl overflow-y-auto bottom-0 left-0 right-0 h-[70vh] rounded-t-2xl animate-slide-up md:top-0 md:right-0 md:left-auto md:bottom-auto md:h-full md:w-full md:max-w-md md:rounded-t-none md:rounded-l-2xl md:animate-slide-right">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 text-xl"
        >
          ×
        </button>

        <div className="p-6 pt-8">
          <h2 className="text-xl font-semibold text-gray-800 pr-8">
            {title}
          </h2>
          {subtitleCountry && subtitleCountry !== title && (
            <p className="text-sm text-gray-500 mt-1">{subtitleCountry}</p>
          )}

          {friendPreview && (
            <p className="mt-3 text-xs text-gray-500 leading-relaxed bg-amber-50/80 border border-amber-100 rounded-lg px-3 py-2">
              Not on your map yet. Add a visit, a place note, or toggle Next Up to save this spot.
            </p>
          )}

          <div className="mt-4 flex items-center gap-3 pb-5">
            <div className="relative">
              <button
                type="button"
                onClick={() => void handleNextUpToggle()}
                disabled={nextUpDisabled}
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
              <span className="absolute top-full left-0 right-0 mt-1 text-xs text-gray-400 text-center whitespace-nowrap">{nextUpCount} of 5 used</span>
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

          <hr className="my-6 border-gray-100" />

          {showDeleteControls && (
            confirmDelete ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleDeleteDestination()}
                  className="flex-1 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                >
                  Confirm delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="w-full py-2 text-sm text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                Delete destination
              </button>
            )
          )}
        </div>
      </aside>
    </>
  )
}
