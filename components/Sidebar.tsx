'use client'

import { useState, useEffect } from 'react'
import { Destination, PlaceNote, Visit, Sentiment } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import PlaceNoteInput from '@/components/PlaceNoteInput'
import PlaceNoteCard from '@/components/PlaceNoteCard'
import VisitCard from '@/components/VisitCard'
import AddVisitForm from '@/components/AddVisitForm'

interface SidebarProps {
  destination: Destination | null
  onClose: () => void
  onDestinationUpdate: (dest: Destination) => void
  onDestinationDelete: (destId: string) => void
  nextUpCount: number
}

const MOCK_FRIENDS = [
  { initials: 'SM', color: 'bg-purple-500', name: 'Sarah Miller', year: 2021, note: 'Brooklyn Bridge at sunrise is worth the early alarm.' },
  { initials: 'JC', color: 'bg-teal-500', name: 'James Chen', year: 2023, note: 'The coffee scene in Williamsburg is incredible. Spent every morning exploring...' },
  { initials: 'AL', color: 'bg-orange-500', name: 'Alex Liu', year: 2020, note: 'Central Park is huge! Don\'t try to see it all in one day.' },
]

/** Most recent year_start first; missing year_start at the end. */
function sortVisitsByYearStartDesc(visits: Visit[]): Visit[] {
  return [...visits].sort((a, b) => {
    const ya = a.year_start ?? null
    const yb = b.year_start ?? null
    if (ya == null && yb == null) return 0
    if (ya == null) return 1
    if (yb == null) return -1
    return yb - ya
  })
}

export default function Sidebar({
  destination,
  onClose,
  onDestinationUpdate,
  onDestinationDelete,
  nextUpCount,
}: SidebarProps) {
  const [visits, setVisits] = useState<Visit[]>(() =>
    sortVisitsByYearStartDesc(destination?.visits ?? [])
  )
  const [placeNotes, setPlaceNotes] = useState<PlaceNote[]>([])
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showAddVisit, setShowAddVisit] = useState(false)
  const [showAddPlace, setShowAddPlace] = useState(false)

  useEffect(() => {
    setVisits(sortVisitsByYearStartDesc(destination?.visits ?? []))
  }, [destination])

  useEffect(() => {
    if (!destination) return
    let cancelled = false
    async function fetchNotes() {
      const { data } = await supabase
        .from('place_notes')
        .select('*')
        .eq('destination_id', destination!.id)
        .order('created_at', { ascending: false })
      if (!cancelled && data) setPlaceNotes(data)
    }
    fetchNotes()
    return () => { cancelled = true }
  }, [destination])

  if (!destination) return null

  // ── Next Up toggle ────────────────────────────────────────────────

  async function handleNextUpToggle() {
    const newNextUp = !destination!.next_up

    // Toggling on — enforce the 5-slot cap (button is disabled, this is belt-and-suspenders)
    if (newNextUp && nextUpCount >= 5) return

    // Toggling off with no visits — destination has no state, delete it entirely
    if (!newNextUp && visits.length === 0) {
      await supabase.from('destinations').delete().eq('id', destination!.id)
      onDestinationDelete(destination!.id)
      onClose()
      return
    }

    const { data } = await supabase
      .from('destinations')
      .update({ next_up: newNextUp, next_up_year: newNextUp ? destination!.next_up_year : null })
      .eq('id', destination!.id)
      .select()
      .single()
    if (data) onDestinationUpdate({ ...data, visits })
  }

  async function handleNextUpYearBlur(value: string) {
    const parsed = value ? parseInt(value, 10) : null
    const { data } = await supabase
      .from('destinations')
      .update({ next_up_year: parsed })
      .eq('id', destination!.id)
      .select()
      .single()
    if (data) onDestinationUpdate({ ...data, visits })
  }

  // ── Visit CRUD ────────────────────────────────────────────────────

  function handleVisitChange(updated: Visit) {
    const newVisits = sortVisitsByYearStartDesc(
      visits.map((v) => (v.id === updated.id ? updated : v))
    )
    setVisits(newVisits)
    onDestinationUpdate({ ...destination!, visits: newVisits })
  }

  function handleVisitDelete(visitId: string) {
    const newVisits = sortVisitsByYearStartDesc(visits.filter((v) => v.id !== visitId))
    setVisits(newVisits)
    onDestinationUpdate({ ...destination!, visits: newVisits })
  }

  function handleAddVisitSave(visit: Visit) {
    const newVisits = sortVisitsByYearStartDesc([...visits, visit])
    setVisits(newVisits)
    onDestinationUpdate({ ...destination!, visits: newVisits })
    setShowAddVisit(false)
  }

  // ── Place notes ───────────────────────────────────────────────────

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

  // ── Destination delete ────────────────────────────────────────────

  async function handleDeleteDestination() {
    await supabase.from('destinations').delete().eq('id', destination!.id)
    onDestinationDelete(destination!.id)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />

      <aside className="fixed z-40 bg-white shadow-2xl overflow-y-auto bottom-0 left-0 right-0 h-[70vh] rounded-t-2xl animate-slide-up md:top-0 md:right-0 md:left-auto md:bottom-auto md:h-full md:w-full md:max-w-md md:rounded-t-none md:rounded-l-2xl md:animate-slide-right">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 text-xl"
        >
          ×
        </button>

        <div className="p-6 pt-8">
          {/* ── Destination name + country ───────────────────────── */}
          <h2 className="text-xl font-semibold text-gray-800 pr-8">
            {destination.name}
          </h2>
          {destination.country_name && destination.country_name !== destination.name && (
            <p className="text-sm text-gray-500 mt-1">{destination.country_name}</p>
          )}

          {/* ── Next Up toggle ───────────────────────────────────── */}
          <div className="mt-4 flex items-center gap-3 pb-5">
            <div className="relative">
              <button
                onClick={handleNextUpToggle}
                disabled={!destination.next_up && nextUpCount >= 5}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  destination.next_up ? 'bg-[#7C3AED]' : 'bg-gray-200'
                } disabled:cursor-not-allowed`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    destination.next_up ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="absolute top-full left-0 right-0 mt-1 text-xs text-gray-400 text-center whitespace-nowrap">{nextUpCount} of 5 used</span>
            </div>
            <span className="text-sm text-gray-600">Next up</span>
            {destination.next_up && (
              <input
                type="number"
                defaultValue={destination.next_up_year ?? ''}
                onBlur={(e) => handleNextUpYearBlur(e.target.value)}
                placeholder="Year"
                min="1900"
                max="2100"
                className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
              />
            )}
          </div>

          {/* ── Visit history ────────────────────────────────────── */}
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

            {showAddVisit ? (
              <AddVisitForm
                destinationId={destination.id}
                onSave={handleAddVisitSave}
                onCancel={() => setShowAddVisit(false)}
              />
            ) : (
              <button
                onClick={() => setShowAddVisit(true)}
                className="mt-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                + Add visit
              </button>
            )}
          </div>

          {/* ── Places ───────────────────────────────────────────── */}
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

            {showAddPlace ? (
              <PlaceNoteInput
                destinationId={destination.id}
                countryCode={destination.country_code ?? ''}
                onSave={handleNoteSaved}
                onCancel={() => setShowAddPlace(false)}
              />
            ) : (
              <button
                onClick={() => setShowAddPlace(true)}
                className="mt-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                + Add place
              </button>
            )}
          </div>

          {/* ── Friends who've been here (placeholder) ───────────── */}
          <div className="mt-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Friends who&rsquo;ve been here
            </p>

            <div className="space-y-3">
              {MOCK_FRIENDS.map((friend) => (
                <div key={friend.initials} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full ${friend.color} flex items-center justify-center shrink-0`}>
                    <span className="text-xs font-semibold text-white">{friend.initials}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <p className="text-sm font-medium text-gray-700">{friend.name}</p>
                      <span className="text-xs text-gray-400">{friend.year}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5 leading-snug">{friend.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <hr className="my-6 border-gray-100" />

          {/* ── Delete destination ────────────────────────────────── */}
          {confirmDelete ? (
            <div className="flex gap-2">
              <button
                onClick={handleDeleteDestination}
                className="flex-1 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
              >
                Confirm delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full py-2 text-sm text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              Delete destination
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
