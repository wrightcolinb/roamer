'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { UserContextProvider, useUser } from '@/lib/UserContext'
import Map, { MapHandle } from '@/components/Map'
import ModeToggle from '@/components/ModeToggle'
import OnboardingCallout from '@/components/OnboardingCallout'
import SearchBar, { PlaceSelection } from '@/components/SearchBar'
import AddDestinationModal from '@/components/AddDestinationModal'
import Sidebar from '@/components/Sidebar'
import CountryPanel from '@/components/CountryPanel'
import ExportButton from '@/components/ExportButton'
import ExportModal from '@/components/ExportModal'
import StatBlock from '@/components/StatBlock'
import { MapMode, Country, Destination, Visit, VisitType } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { getContinentFromCode } from '@/lib/countryUtils'
import { shouldPromoteCountry } from '@/lib/mapUtils'

type ModalType = VisitType | 'next_up'

// ── Outer shell — provides UserContext ────────────────────────────────────────

export default function UserPage({ params }: { params: { slug: string } }) {
  return (
    <UserContextProvider slug={params.slug}>
      <MapPageContent />
    </UserContextProvider>
  )
}

// ── Inner page — reads user from context, renders map ────────────────────────

function MapPageContent() {
  const { user, loading } = useUser()

  const [mode, setMode] = useState<MapMode>('fill')
  const [countries, setCountries] = useState<Country[]>([])
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [onboardingDismissed, setOnboardingDismissed] = useState(true)

  const [selectedPlace, setSelectedPlace] = useState<PlaceSelection | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null)
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null)
  const [selectedCountryName, setSelectedCountryName] = useState<string>('')

  const [exportModalOpen, setExportModalOpen] = useState(false)

  const mapRef = useRef<MapHandle>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Onboarding key is namespaced per user so two users on the same device
  // each get their own first-run experience.
  const onboardingKey = user ? `roamer_onboarding_${user.id}` : null

  useEffect(() => {
    if (!onboardingKey) return
    const dismissed = localStorage.getItem(onboardingKey) === 'true'
    setOnboardingDismissed(dismissed)
  }, [onboardingKey])

  useEffect(() => {
    if (!user) return
    async function fetchData() {
      const [countriesRes, destinationsRes, visitsRes] = await Promise.all([
        supabase.from('countries').select('*').eq('user_id', user!.id),
        supabase.from('destinations').select('*').eq('user_id', user!.id),
        supabase.from('visits').select('*'),
      ])

      if (countriesRes.data) setCountries(countriesRes.data)

      if (destinationsRes.data) {
        const allVisits: Visit[] = visitsRes.data ?? []
        const dests: Destination[] = destinationsRes.data.map((d) => ({
          ...d,
          visits: allVisits.filter((v) => v.destination_id === d.id),
        }))
        setDestinations(dests)
      }
    }
    fetchData()
  }, [user])

  const handleToggle = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'fill' ? 'explore' : 'fill'
      if (prev === 'fill' && !onboardingDismissed && onboardingKey) {
        setOnboardingDismissed(true)
        localStorage.setItem(onboardingKey, 'true')
      }
      return next
    })
    closePanels()
  }, [onboardingDismissed, onboardingKey])

  // ── Fill-mode country cycling ─────────────────────────────────────────────

  const cycleCountryStatus = useCallback(async (countryCode: string, countryName: string) => {
    if (!user) return
    const existing = countries.find((c) => c.country_code === countryCode)

    if (!existing) {
      const continent = getContinentFromCode(countryCode)
      const { data } = await supabase
        .from('countries')
        .insert({ user_id: user.id, country_code: countryCode, country_name: countryName, continent, status: 'visited' })
        .select()
        .single()
      if (data) setCountries((prev) => [...prev, data])
    } else if (existing.status === 'visited') {
      const { data } = await supabase
        .from('countries')
        .update({ status: 'lived' })
        .eq('id', existing.id)
        .select()
        .single()
      if (data) setCountries((prev) => prev.map((c) => (c.id === existing.id ? data : c)))
    } else {
      await supabase.from('countries').delete().eq('id', existing.id)
      setCountries((prev) => prev.filter((c) => c.id !== existing.id))
    }
  }, [countries, user])

  // ── Map click handlers ────────────────────────────────────────────────────

  const handleCountryClick = useCallback((countryCode: string, countryName: string) => {
    if (mode === 'fill') {
      cycleCountryStatus(countryCode, countryName)
    } else {
      setSelectedDestination(null)
      setSelectedCountryCode(countryCode)
      setSelectedCountryName(countryName)
    }
  }, [mode, cycleCountryStatus])

  const handleDestinationClick = useCallback((dest: Destination) => {
    setSelectedCountryCode(null)
    setSelectedDestination(dest)
  }, [])

  const handleBackgroundClick = useCallback(() => {
    closePanels()
  }, [])

  function closePanels() {
    setSelectedDestination(null)
    setSelectedCountryCode(null)
  }

  // ── Sidebar callbacks ─────────────────────────────────────────────────────

  const handleDestinationUpdate = useCallback((updated: Destination) => {
    setDestinations((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
    setSelectedDestination((prev) => (prev?.id === updated.id ? updated : prev))
  }, [])

  const handleDestinationDelete = useCallback((destId: string) => {
    setDestinations((prev) => prev.filter((d) => d.id !== destId))
    setSelectedDestination(null)
  }, [])

  // ── CountryPanel callbacks ────────────────────────────────────────────────

  const handleCountryUpdateFromPanel = useCallback((updated: Country) => {
    setCountries((prev) => {
      const idx = prev.findIndex((c) => c.id === updated.id)
      if (idx >= 0) return prev.map((c) => (c.id === updated.id ? updated : c))
      return [...prev, updated]
    })
  }, [])

  const handleCountryRemoveFromPanel = useCallback((countryId: string) => {
    setCountries((prev) => prev.filter((c) => c.id !== countryId))
  }, [])

  const handleDestinationClickFromPanel = useCallback((dest: Destination) => {
    setSelectedCountryCode(null)
    setSelectedDestination(dest)
  }, [])

  // ── Search / Add Destination ──────────────────────────────────────────────

  const handlePlaceSelected = useCallback((place: PlaceSelection) => {
    setSelectedPlace(place)
    setModalOpen(true)
  }, [])

  const handleSaveDestination = useCallback(async (
    destType: ModalType,
    yearStart?: number,
    yearEnd?: number,
    monthStart?: number,
    notes?: string,
  ) => {
    if (!selectedPlace || !user) return

    // 1. Create destination record (scoped to this user)
    const { data: newDest } = await supabase
      .from('destinations')
      .insert({
        user_id: user.id,
        name: selectedPlace.name,
        place_id: selectedPlace.place_id,
        lat: selectedPlace.lat,
        lng: selectedPlace.lng,
        country_code: selectedPlace.country_code,
        country_name: selectedPlace.country_name,
        continent: selectedPlace.continent,
        next_up: destType === 'next_up',
        next_up_year: destType === 'next_up' ? yearStart : null,
      })
      .select()
      .single()

    if (!newDest) return

    // 2. If visited or lived, create a visit record
    let visits: Visit[] = []
    if (destType === 'visited' || destType === 'lived') {
      const { data: visit } = await supabase
        .from('visits')
        .insert({
          destination_id: newDest.id,
          user_id: user.id,
          type: destType,
          year_start: yearStart,
          month_start: monthStart ?? null,
          year_end: destType === 'lived' ? yearEnd : undefined,
          notes: notes ?? '',
        })
        .select()
        .single()
      if (visit) visits = [visit]

      // 3. Country auto-promotion (only for visited/lived, scoped to this user)
      if (selectedPlace.country_code) {
        const existingCountry = countries.find(
          (c) => c.country_code === selectedPlace.country_code
        )
        const existingStatus = existingCountry?.status ?? null
        const newStatus = shouldPromoteCountry(existingStatus, destType)

        if (newStatus) {
          if (existingCountry) {
            const { data } = await supabase
              .from('countries')
              .update({ status: newStatus })
              .eq('id', existingCountry.id)
              .select()
              .single()
            if (data) setCountries((prev) => prev.map((c) => (c.id === existingCountry.id ? data : c)))
          } else {
            const { data } = await supabase
              .from('countries')
              .insert({
                user_id: user.id,
                country_code: selectedPlace.country_code,
                country_name: selectedPlace.country_name,
                continent: selectedPlace.continent,
                status: newStatus,
              })
              .select()
              .single()
            if (data) setCountries((prev) => [...prev, data])
          }
        }
      }
    }

    setDestinations((prev) => [...prev, { ...newDest, visits }])
    mapRef.current?.flyTo(selectedPlace.lat, selectedPlace.lng)

    setModalOpen(false)
    setSelectedPlace(null)
  }, [selectedPlace, countries, user])

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return null

  if (!user) {
    return (
      <main className="h-screen w-screen flex items-center justify-center bg-[#F5F0E8]">
        <p className="text-gray-500 text-sm">User not found.</p>
      </main>
    )
  }

  const showOnboarding = mode === 'fill' && !onboardingDismissed
  const nextUpCount = destinations.filter((d) => d.next_up).length

  return (
    <main className="h-screen w-screen relative">
      <div ref={mapContainerRef} className="absolute inset-0">
        <Map
          ref={mapRef}
          mode={mode}
          countries={countries}
          destinations={destinations}
          onCountryClick={handleCountryClick}
          onDestinationClick={handleDestinationClick}
          onBackgroundClick={handleBackgroundClick}
        />
        <StatBlock countries={countries} destinations={destinations} />
      </div>
      <SearchBar onPlaceSelected={handlePlaceSelected} />
      <AddDestinationModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedPlace(null) }}
        onSave={handleSaveDestination}
        placeName={selectedPlace?.name ?? ''}
        nextUpCount={nextUpCount}
      />
      <Sidebar
        key={selectedDestination?.id ?? 'none'}
        destination={selectedDestination}
        onClose={() => setSelectedDestination(null)}
        onDestinationUpdate={handleDestinationUpdate}
        onDestinationDelete={handleDestinationDelete}
        nextUpCount={nextUpCount}
      />
      <CountryPanel
        countryCode={selectedCountryCode}
        countryName={selectedCountryName}
        countries={countries}
        destinations={destinations}
        onClose={() => setSelectedCountryCode(null)}
        onCountryUpdate={handleCountryUpdateFromPanel}
        onCountryRemove={handleCountryRemoveFromPanel}
        onDestinationClick={handleDestinationClickFromPanel}
      />
      <ExportButton setExportModalOpen={setExportModalOpen} />
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        mapRef={mapRef}
        mapContainerRef={mapContainerRef}
      />
      {mode === 'fill' && (
        <div
          className="fixed inset-0 z-50 pointer-events-none"
          style={{ boxShadow: 'inset 0 0 0 4px #E8735A, inset 0 0 80px rgba(232, 115, 90, 0.3)' }}
        />
      )}
      <OnboardingCallout visible={showOnboarding} />
      <ModeToggle mode={mode} onToggle={handleToggle} />
    </main>
  )
}
