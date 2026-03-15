"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { Destination } from "@/lib/types";

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

interface SearchBarProps {
  onAdd: (destination: Destination) => void;
}

interface PlaceSuggestion {
  place_id: string;
  description: string;
}

interface SelectedPlace {
  name: string;
  place_id: string;
  lat: number;
  lng: number;
}

async function fetchAutocomplete(input: string): Promise<PlaceSuggestion[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_API_KEY!,
    },
    body: JSON.stringify({ input }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.suggestions || [])
    .filter((s: any) => s.placePrediction)
    .map((s: any) => ({
      place_id: s.placePrediction.placeId,
      description: s.placePrediction.text.text,
    }));
}

async function fetchPlaceDetails(placeId: string): Promise<SelectedPlace | null> {
  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      "X-Goog-Api-Key": GOOGLE_API_KEY!,
      "X-Goog-FieldMask": "displayName,location",
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.location) return null;
  return {
    name: data.displayName?.text || placeId,
    place_id: placeId,
    lat: data.location.latitude,
    lng: data.location.longitude,
  };
}

export default function SearchBar({ onAdd }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  function handleInputChange(value: string) {
    setQuery(value);
    setSelectedPlace(null);
    clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const results = await fetchAutocomplete(value);
      setSuggestions(results);
    }, 300);
  }

  async function handleSelect(suggestion: PlaceSuggestion) {
    const place = await fetchPlaceDetails(suggestion.place_id);
    if (place) {
      setSelectedPlace(place);
      setQuery(place.name);
      setSuggestions([]);
    }
  }

  async function handleStatusSelect(status: Destination["status"]) {
    if (!selectedPlace) return;
    const { data } = await supabase
      .from("destinations")
      .insert({
        name: selectedPlace.name,
        place_id: selectedPlace.place_id,
        lat: selectedPlace.lat,
        lng: selectedPlace.lng,
        status,
        notes: "",
      })
      .select()
      .single();

    if (data) {
      onAdd(data as Destination);
      reset();
    }
  }

  function reset() {
    setQuery("");
    setSelectedPlace(null);
    setSuggestions([]);
  }

  return (
    <div className="fixed left-0 top-0 z-20 w-full p-3 md:left-4 md:top-4 md:w-96 md:p-0">
      <input
        type="text"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder="Search for a place…"
        className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white placeholder-gray-500 shadow-lg focus:border-blue-500 focus:outline-none"
      />

      {suggestions.length > 0 && (
        <ul className="mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-700 bg-gray-900 shadow-lg">
          {suggestions.map((s) => (
            <li
              key={s.place_id}
              onClick={() => handleSelect(s)}
              className="cursor-pointer px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              {s.description}
            </li>
          ))}
        </ul>
      )}

      {selectedPlace && (
        <div className="mt-2 rounded-lg border border-gray-700 bg-gray-900 p-3 shadow-lg">
          <p className="mb-2 text-xs text-gray-400">Save as…</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusSelect("been")}
              className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
            >
              Been
            </button>
            <button
              onClick={() => handleStatusSelect("planning")}
              className="flex-1 rounded-md bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700"
            >
              Planning
            </button>
            <button
              onClick={() => handleStatusSelect("dreaming")}
              className="flex-1 rounded-md bg-purple-600 px-3 py-2 text-xs font-medium text-white hover:bg-purple-700"
            >
              Dreaming
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
