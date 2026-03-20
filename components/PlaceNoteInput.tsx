'use client'

import { useState, useRef, useCallback } from 'react'
import { PlaceNote, Sentiment } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { getCategoryEmoji } from '@/lib/mapUtils'

interface PlaceNoteInputProps {
  destinationId: string
  countryCode: string
  onSave: (note: PlaceNote) => void
  onCancel: () => void
}

const SENTIMENT_OPTS: { value: Sentiment; label: string; color: string; bg: string }[] = [
  { value: 'recommend', label: 'Recommend', color: '#1D9E75', bg: 'rgba(29, 158, 117, 0.12)' },
  { value: 'meh', label: 'Meh', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.12)' },
  { value: 'skip', label: 'Skip', color: '#D85A30', bg: 'rgba(216, 90, 48, 0.12)' },
]

function getPlacesApi(): any | null {
  const g = (window as any).google
  return g?.maps?.places ?? null
}

export default function PlaceNoteInput({
  destinationId,
  countryCode,
  onSave,
  onCancel,
}: PlaceNoteInputProps) {
  const [placeName, setPlaceName] = useState('')
  const [note, setNote] = useState('')
  const [selectedSentiment, setSelectedSentiment] = useState<Sentiment>('recommend')
  const [predictions, setPredictions] = useState<{ placeId: string; text: string }[]>([])
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const sessionTokenRef = useRef<any>(null)

  function getSessionToken() {
    const places = getPlacesApi()
    if (!sessionTokenRef.current && places?.AutocompleteSessionToken) {
      sessionTokenRef.current = new places.AutocompleteSessionToken()
    }
    return sessionTokenRef.current
  }

  const fetchPredictions = useCallback(async (input: string) => {
    const places = getPlacesApi()
    if (!places?.AutocompleteSuggestion) return

    try {
      const request: any = {
        input,
        sessionToken: getSessionToken(),
      }
      if (countryCode) {
        request.includedRegionCodes = [countryCode.toLowerCase()]
      }

      const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request)

      setPredictions(
        suggestions
          .filter((s: any) => s.placePrediction)
          .map((s: any) => ({
            placeId: s.placePrediction.placeId,
            text: s.placePrediction.text.text,
          }))
      )
      setIsOpen(true)
    } catch {
      setPredictions([])
    }
  }, [countryCode])

  function handleInputChange(value: string) {
    setPlaceName(value)
    setSelectedPlaceId(null)
    clearTimeout(debounceRef.current)

    if (value.length < 2) {
      setPredictions([])
      setIsOpen(false)
      return
    }

    debounceRef.current = setTimeout(() => {
      fetchPredictions(value)
    }, 300)
  }

  function handleSelectPrediction(p: { placeId: string; text: string }) {
    setPlaceName(p.text)
    setSelectedPlaceId(p.placeId)
    setPredictions([])
    setIsOpen(false)
    sessionTokenRef.current = null
  }

  async function handleSave() {
    if (!placeName.trim() || saving) return
    setSaving(true)

    const trimmedName = placeName.trim()
    const categoryEmoji = getCategoryEmoji(trimmedName)

    const { data } = await supabase
      .from('place_notes')
      .insert({
        destination_id: destinationId,
        place_name: trimmedName,
        place_id: selectedPlaceId,
        sentiment: selectedSentiment,
        category_emoji: categoryEmoji,
        note: note.trim(),
      })
      .select()
      .single()

    setSaving(false)
    if (data) onSave(data)
  }

  return (
    <div className="border border-gray-200 rounded-xl p-3 mt-2 space-y-2">
      {/* 1. Place name autocomplete */}
      <div className="relative">
        <input
          type="text"
          value={placeName}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Place name..."
          autoFocus
          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
        />
        {isOpen && predictions.length > 0 && (
          <ul className="absolute top-full mt-0.5 w-full bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-50 max-h-32 overflow-y-auto">
            {predictions.map((p) => (
              <li
                key={p.placeId}
                onClick={() => handleSelectPrediction(p)}
                className="px-2 py-1.5 text-xs text-gray-700 cursor-pointer hover:bg-gray-50 border-b border-gray-50 last:border-b-0"
              >
                {p.text}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 2. Note text */}
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="What did you think?"
        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
      />

      {/* 3. Sentiment selector — colored text labels, no emojis */}
      <div className="flex gap-1.5">
        {SENTIMENT_OPTS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSelectedSentiment(opt.value)}
            className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
            style={{
              color: opt.color,
              backgroundColor: selectedSentiment === opt.value ? opt.bg : 'transparent',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-1.5 border border-gray-200 text-xs text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!placeName.trim() || saving}
          className="flex-1 py-1.5 bg-gray-800 text-white text-xs rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? '...' : 'Save'}
        </button>
      </div>
    </div>
  )
}
