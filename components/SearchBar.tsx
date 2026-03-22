'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { getCountryFromPlacesResult } from '@/lib/countryUtils'

export interface PlaceSelection {
  name: string
  place_id: string
  lat: number
  lng: number
  country_code: string
  country_name: string
  continent: string
}

interface SearchBarProps {
  onPlaceSelected: (place: PlaceSelection) => void
}

interface Prediction {
  placeId: string
  text: string
  placePrediction: any
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function getPlacesApi(): any | null {
  const g = (window as any).google
  return g?.maps?.places ?? null
}

export default function SearchBar({ onPlaceSelected }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const sessionTokenRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  function getSessionToken() {
    const places = getPlacesApi()
    if (!sessionTokenRef.current && places?.AutocompleteSessionToken) {
      sessionTokenRef.current = new places.AutocompleteSessionToken()
    }
    return sessionTokenRef.current
  }

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
    const places = getPlacesApi()
    if (!places?.AutocompleteSuggestion) return

    try {
      const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input,
        sessionToken: getSessionToken(),
      })

      setPredictions(
        suggestions
          .filter((s: any) => s.placePrediction)
          .map((s: any) => ({
            placeId: s.placePrediction.placeId,
            text: s.placePrediction.text.text,
            placePrediction: s.placePrediction,
          }))
      )
      setIsLoading(false)
      setIsOpen(true)
    } catch {
      setPredictions([])
      setIsLoading(false)
    }
  }, [])

  function handleInputChange(value: string) {
    setQuery(value)
    setHighlightedIndex(-1)
    clearTimeout(debounceRef.current)

    if (value.length < 2) {
      setPredictions([])
      setIsLoading(false)
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    setIsOpen(true)
    debounceRef.current = setTimeout(() => {
      fetchPredictions(value)
    }, 300)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || predictions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) =>
        prev < predictions.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : predictions.length - 1
      )
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault()
      handleSelect(predictions[highlightedIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setHighlightedIndex(-1)
    }
  }

  async function handleSelect(prediction: Prediction) {
    try {
      const place = prediction.placePrediction.toPlace()
      await place.fetchFields({
        fields: ['displayName', 'location', 'addressComponents', 'id'],
      })

      const { country_code, country_name, continent } = getCountryFromPlacesResult({
        addressComponents: place.addressComponents,
      })

      onPlaceSelected({
        name: place.displayName,
        place_id: place.id,
        lat: place.location.lat(),
        lng: place.location.lng(),
        country_code,
        country_name,
        continent,
      })

      setQuery('')
      setPredictions([])
      setIsOpen(false)
      sessionTokenRef.current = null
    } catch (e) {
      console.error('Place details error:', e)
    }
  }

  return (
    <div
      ref={containerRef}
      className="fixed top-[calc(1rem+env(safe-area-inset-top))] left-4 right-[60px] md:right-auto md:w-96 z-10"
    >
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <SearchIcon />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search for a destination..."
          role="combobox"
          aria-expanded={isOpen && predictions.length > 0}
          aria-activedescendant={highlightedIndex >= 0 ? `prediction-${highlightedIndex}` : undefined}
          className="w-full px-4 py-3 pl-10 bg-white rounded-xl shadow-lg border border-gray-100 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200"
        />

        {isOpen && (isLoading || predictions.length > 0) && (
          <ul role="listbox" className="absolute top-full mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {isLoading ? (
              <>
                {[72, 56, 64].map((w, i) => (
                  <li key={i} className="px-4 py-3 border-b border-gray-50 last:border-b-0">
                    <div className="h-3 bg-gray-100 rounded animate-pulse" style={{ width: `${w}%` }} />
                  </li>
                ))}
              </>
            ) : (
              predictions.map((p, i) => (
                <li
                  key={p.placeId}
                  id={`prediction-${i}`}
                  role="option"
                  aria-selected={i === highlightedIndex}
                  onClick={() => handleSelect(p)}
                  onMouseEnter={() => setHighlightedIndex(i)}
                  className={`px-4 py-3 text-sm text-gray-700 cursor-pointer border-b border-gray-50 last:border-b-0 ${
                    i === highlightedIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
                  }`}
                >
                  {p.text}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  )
}
