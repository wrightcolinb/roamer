'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Continent } from '@/lib/types'
import { countryToContinent } from '@/lib/mapUtils'

export interface ResolvedPlace {
  name: string
  place_id: string
  lat: number
  lng: number
  country?: string
  continent?: Continent
}

interface SearchBarProps {
  onPlaceSelect: (place: ResolvedPlace) => void
}

interface PlacePrediction {
  placeId: string
  text: { text: string }
  structuredFormat: {
    mainText: { text: string }
    secondaryText: { text: string }
  }
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

async function fetchAutocomplete(input: string): Promise<PlacePrediction[]> {
  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY ?? '',
    },
    body: JSON.stringify({
      input,
      includedPrimaryTypes: ['locality', 'administrative_area_level_3', 'administrative_area_level_1'],
      languageCode: 'en',
    }),
  })

  if (!res.ok) return []
  const data = await res.json()
  return (data.suggestions ?? [])
    .filter((s: { placePrediction?: PlacePrediction }) => s.placePrediction)
    .map((s: { placePrediction: PlacePrediction }) => s.placePrediction)
}

async function fetchPlaceDetails(placeId: string): Promise<ResolvedPlace | null> {
  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': API_KEY ?? '',
      'X-Goog-FieldMask': 'displayName,location,addressComponents,id',
    },
  })

  if (!res.ok) return null
  const data = await res.json()

  const countryComponent = data.addressComponents?.find(
    (c: { types: string[] }) => c.types.includes('country')
  )
  const country = countryComponent?.longText
  const continent = country ? countryToContinent(country) : undefined

  return {
    name: data.displayName?.text ?? '',
    place_id: placeId,
    lat: data.location?.latitude,
    lng: data.location?.longitude,
    country,
    continent,
  }
}

export default function SearchBar({ onPlaceSelect }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchPredictions = useCallback(async (input: string) => {
    if (input.length < 2) {
      setPredictions([])
      setIsOpen(false)
      return
    }

    const results = await fetchAutocomplete(input)
    setPredictions(results)
    setIsOpen(results.length > 0)
  }, [])

  function handleInputChange(value: string) {
    setQuery(value)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => fetchPredictions(value), 300)
  }

  async function handleSelect(prediction: PlacePrediction) {
    setLoading(true)
    const place = await fetchPlaceDetails(prediction.placeId)
    setLoading(false)

    if (!place) return

    onPlaceSelect(place)
    setQuery('')
    setPredictions([])
    setIsOpen(false)
  }

  return (
    <div
      ref={containerRef}
      className="absolute left-4 top-4 z-10 w-72 md:w-80"
    >
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          width="16" height="16" viewBox="0 0 16 16" fill="none"
        >
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => { if (predictions.length > 0) setIsOpen(true) }}
          placeholder="Search for a place…"
          className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-9 pr-4 text-sm text-stone-700 shadow-sm placeholder:text-stone-400 focus:border-stone-400 focus:outline-none"
        />
      </div>

      {isOpen && predictions.length > 0 && (
        <ul className="mt-1 max-h-64 overflow-y-auto rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
          {predictions.map((p) => (
            <li key={p.placeId}>
              <button
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-stone-50 disabled:opacity-50"
                onClick={() => handleSelect(p)}
                disabled={loading}
              >
                <span className="font-medium text-stone-800">
                  {p.structuredFormat.mainText.text}
                </span>
                <span className="ml-1 text-stone-400">
                  {p.structuredFormat.secondaryText.text}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
