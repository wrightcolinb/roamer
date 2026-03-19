'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Map, { type MapHandle } from '@/components/Map'
import Sidebar from '@/components/Sidebar'
import SearchBar, { type ResolvedPlace } from '@/components/SearchBar'
import AddPlaceModal from '@/components/AddPlaceModal'
import ExportButton from '@/components/ExportButton'
import { supabase } from '@/lib/supabase'
import { countryToContinent } from '@/lib/mapUtils'
import type { Destination, Visit, Intent, AddPlaceData } from '@/lib/types'

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

async function reverseGeocode(lat: number, lng: number): Promise<ResolvedPlace | null> {
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`
  )
  if (!res.ok) return null
  const data = await res.json()

  const result = data.results?.[0]
  if (!result) return null

  const locality = result.address_components?.find(
    (c: { types: string[] }) => c.types.includes('locality')
  )
  const adminArea = result.address_components?.find(
    (c: { types: string[] }) => c.types.includes('administrative_area_level_1')
  )
  const countryComp = result.address_components?.find(
    (c: { types: string[] }) => c.types.includes('country')
  )

  const name = locality?.long_name ?? adminArea?.long_name ?? result.formatted_address ?? 'Unknown'
  const country = countryComp?.long_name
  const continent = country ? countryToContinent(country) : undefined

  return {
    name,
    place_id: result.place_id,
    lat,
    lng,
    country,
    continent,
  }
}

type ModalState =
  | { kind: 'new-place'; place: ResolvedPlace }
  | { kind: 'add-visit'; destination: Destination }
  | { kind: 'add-intent'; destination: Destination }
  | null

export default function Home() {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null)
  const [modal, setModal] = useState<ModalState>(null)
  const [addPlaceMode, setAddPlaceMode] = useState(false)
  const mapRef = useRef<MapHandle>(null)

  useEffect(() => {
    async function loadDestinations() {
      const [destResult, visitsResult, intentsResult] = await Promise.all([
        supabase.from('destinations').select('*'),
        supabase.from('visits').select('*'),
        supabase.from('intents').select('*'),
      ])

      const dests = (destResult.data ?? []) as Omit<Destination, 'visits' | 'intent'>[]
      const visits = (visitsResult.data ?? []) as Visit[]
      const intents = (intentsResult.data ?? []) as Intent[]

      const assembled: Destination[] = dests.map((d) => ({
        ...d,
        visits: visits.filter((v) => v.destination_id === d.id),
        intent: intents.find((i) => i.destination_id === d.id),
      }))

      setDestinations(assembled)
    }

    loadDestinations()
  }, [])

  // Keep selectedDestination in sync when destinations array changes
  useEffect(() => {
    if (selectedDestination) {
      const updated = destinations.find((d) => d.id === selectedDestination.id)
      if (updated) setSelectedDestination(updated)
      else setSelectedDestination(null)
    }
  }, [destinations]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePinClick = useCallback((destination: Destination) => {
    setSelectedDestination(destination)
  }, [])

  const handleMapClick = useCallback(() => {
    setSelectedDestination(null)
  }, [])

  const handleSidebarClose = useCallback(() => {
    setSelectedDestination(null)
  }, [])

  const handlePlaceSelect = useCallback((place: ResolvedPlace) => {
    setModal({ kind: 'new-place', place })
  }, [])

  const handleAddPlaceClick = useCallback(async (lat: number, lng: number) => {
    const place = await reverseGeocode(lat, lng)
    if (place) setModal({ kind: 'new-place', place })
  }, [])

  const handleModalClose = useCallback(() => {
    setModal(null)
    setAddPlaceMode(false)
  }, [])

  const handleDestinationChange = useCallback((updated: Destination) => {
    setDestinations((prev) =>
      prev.map((d) => (d.id === updated.id ? updated : d))
    )
  }, [])

  const handleDeleteDestination = useCallback((id: string) => {
    setDestinations((prev) => prev.filter((d) => d.id !== id))
    setSelectedDestination(null)
  }, [])

  const handleAddVisit = useCallback(() => {
    if (selectedDestination) {
      setModal({ kind: 'add-visit', destination: selectedDestination })
    }
  }, [selectedDestination])

  const handleAddIntent = useCallback(() => {
    if (selectedDestination) {
      setModal({ kind: 'add-intent', destination: selectedDestination })
    }
  }, [selectedDestination])

  const handleModalSave = useCallback(async (data: AddPlaceData) => {
    if (!modal) return

    if (modal.kind === 'new-place') {
      const place = modal.place
      const { data: destRow, error: destError } = await supabase
        .from('destinations')
        .insert({
          name: place.name,
          place_id: place.place_id,
          lat: place.lat,
          lng: place.lng,
          country: place.country,
          continent: place.continent,
        })
        .select()
        .single()

      if (destError || !destRow) {
        console.error('Failed to create destination:', destError)
        return
      }

      let visit: Visit | undefined
      let intent: Intent | undefined

      if (data.mode === 'visit') {
        const { data: visitRow, error: visitError } = await supabase
          .from('visits')
          .insert({
            destination_id: destRow.id,
            type: data.type,
            year_start: data.year_start,
            month_start: data.month_start,
            year_end: data.year_end,
            month_end: data.month_end,
            notes: data.notes,
          })
          .select()
          .single()

        if (visitError) console.error('Failed to create visit:', visitError)
        else visit = visitRow as Visit
      } else {
        const { data: intentRow, error: intentError } = await supabase
          .from('intents')
          .insert({
            destination_id: destRow.id,
            state: data.state,
            target_year: data.target_year,
            notes: data.notes,
          })
          .select()
          .single()

        if (intentError) console.error('Failed to create intent:', intentError)
        else intent = intentRow as Intent
      }

      const newDest: Destination = {
        ...destRow,
        visits: visit ? [visit] : [],
        intent,
      }

      setDestinations((prev) => [...prev, newDest])
      setModal(null)
      setAddPlaceMode(false)
      mapRef.current?.flyTo(newDest.lng, newDest.lat)
    } else if (modal.kind === 'add-visit' && data.mode === 'visit') {
      const dest = modal.destination
      const { data: visitRow, error } = await supabase
        .from('visits')
        .insert({
          destination_id: dest.id,
          type: data.type,
          year_start: data.year_start,
          month_start: data.month_start,
          year_end: data.year_end,
          month_end: data.month_end,
          notes: data.notes,
        })
        .select()
        .single()

      if (error) { console.error('Failed to create visit:', error); return }

      const updated: Destination = {
        ...dest,
        visits: [...dest.visits, visitRow as Visit],
      }
      setDestinations((prev) => prev.map((d) => (d.id === dest.id ? updated : d)))
      setModal(null)
    } else if (modal.kind === 'add-intent' && data.mode === 'intent') {
      const dest = modal.destination
      const { data: intentRow, error } = await supabase
        .from('intents')
        .insert({
          destination_id: dest.id,
          state: data.state,
          target_year: data.target_year,
          notes: data.notes,
        })
        .select()
        .single()

      if (error) { console.error('Failed to create intent:', error); return }

      const updated: Destination = {
        ...dest,
        intent: intentRow as Intent,
      }
      setDestinations((prev) => prev.map((d) => (d.id === dest.id ? updated : d)))
      setModal(null)
    }
  }, [modal])

  const modalPlaceName = modal
    ? modal.kind === 'new-place'
      ? modal.place.name
      : modal.destination.name
    : ''

  const modalCoordinates = modal
    ? modal.kind === 'new-place'
      ? { lat: modal.place.lat, lng: modal.place.lng }
      : { lat: modal.destination.lat, lng: modal.destination.lng }
    : { lat: 0, lng: 0 }

  const modalInitialTab = modal
    ? modal.kind === 'add-intent' ? 'intent' as const : 'visit' as const
    : undefined

  return (
    <main className="h-screen w-screen">
      <Map
        ref={mapRef}
        destinations={destinations}
        addPlaceMode={addPlaceMode}
        onPinClick={handlePinClick}
        onMapClick={handleMapClick}
        onAddPlaceClick={handleAddPlaceClick}
      />
      <SearchBar onPlaceSelect={handlePlaceSelect} />
      <ExportButton
        destinations={destinations}
        mapRef={mapRef}
      />
      <Sidebar
        destination={selectedDestination}
        onClose={handleSidebarClose}
        onDestinationChange={handleDestinationChange}
        onDeleteDestination={handleDeleteDestination}
        onAddVisit={handleAddVisit}
        onAddIntent={handleAddIntent}
      />

      {/* Add place toggle */}
      <button
        onClick={() => setAddPlaceMode((prev) => !prev)}
        className={`fixed bottom-6 right-6 z-10 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-lg transition-colors ${
          addPlaceMode
            ? 'bg-stone-900 text-white'
            : 'bg-white text-stone-700 hover:bg-stone-50'
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {addPlaceMode ? 'Click the map…' : 'Add place'}
      </button>

      {modal && (
        <AddPlaceModal
          placeName={modalPlaceName}
          coordinates={modalCoordinates}
          initialTab={modalInitialTab}
          onSave={handleModalSave}
          onClose={handleModalClose}
        />
      )}
    </main>
  )
}
