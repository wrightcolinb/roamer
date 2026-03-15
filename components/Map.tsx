"use client";

import { useState, useRef, useEffect } from "react";
import { Map as MapGL, Marker, Popup, type MapRef } from "react-map-gl/mapbox";
import type { MapMouseEvent } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Destination } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import Pin from "@/components/Pin";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

interface MapProps {
  destinations: Destination[];
  onPinClick: (destination: Destination) => void;
  onMapClick: () => void;
  onAdd: (destination: Destination) => void;
  flyTo?: { lng: number; lat: number } | null;
}

interface ClickPopup {
  lng: number;
  lat: number;
  name: string;
  place_id?: string;
}

function pickResult(results: any[], zoom: number): any {
  const find = (...types: string[]) =>
    results.find((r: any) => types.some((t) => r.types?.includes(t)));

  if (zoom < 5) {
    return find("country") || results[results.length - 1];
  }
  if (zoom < 10) {
    return find("locality", "administrative_area_level_1") || find("country") || results[0];
  }
  return find("locality", "sublocality", "neighborhood") || results[0];
}

async function reverseGeocode(lat: number, lng: number, zoom: number): Promise<{ name: string; place_id?: string }> {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`
    );
    const data = await res.json();
    if (data.results?.length > 0) {
      const best = pickResult(data.results, zoom);
      return { name: best.formatted_address, place_id: best.place_id };
    }
  } catch { /* fall through */ }
  return { name: `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
}

export default function Map({ destinations, onPinClick, onMapClick, onAdd, flyTo }: MapProps) {
  const mapRef = useRef<MapRef>(null);
  const [clickPopup, setClickPopup] = useState<ClickPopup | null>(null);

  useEffect(() => {
    if (flyTo && mapRef.current) {
      mapRef.current.flyTo({ center: [flyTo.lng, flyTo.lat], zoom: 6, duration: 2000 });
    }
  }, [flyTo]);

  async function handleMapClick(e: MapMouseEvent) {
    onMapClick();
    setClickPopup(null);

    const { lng, lat } = e.lngLat;
    const zoom = mapRef.current?.getZoom() ?? 2;
    const result = await reverseGeocode(lat, lng, zoom);
    setClickPopup({ lng, lat, ...result });
  }

  async function handleStatusSelect(status: Destination["status"]) {
    if (!clickPopup) return;
    const { data } = await supabase
      .from("destinations")
      .insert({
        name: clickPopup.name,
        place_id: clickPopup.place_id || null,
        lat: clickPopup.lat,
        lng: clickPopup.lng,
        status,
        notes: "",
      })
      .select()
      .single();

    if (data) {
      onAdd(data as Destination);
      setClickPopup(null);
    }
  }

  return (
    <MapGL
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{
        longitude: 0,
        latitude: 20,
        zoom: 2,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      onClick={handleMapClick}
    >
      {destinations.map((dest) => (
        <Marker key={dest.id} longitude={dest.lng} latitude={dest.lat} anchor="center">
          <div onClick={(e) => { e.stopPropagation(); onPinClick(dest); }} className="cursor-pointer">
            <Pin status={dest.status} />
          </div>
        </Marker>
      ))}

      {clickPopup && (
        <Popup
          longitude={clickPopup.lng}
          latitude={clickPopup.lat}
          anchor="bottom"
          onClose={() => setClickPopup(null)}
          closeButton={true}
          closeOnClick={false}
        >
          <div className="min-w-[180px] p-1">
            <p className="mb-2 text-sm font-medium text-gray-900 leading-tight">{clickPopup.name}</p>
            <p className="mb-1.5 text-xs text-gray-500">Save as…</p>
            <div className="flex gap-1">
              <button
                onClick={() => handleStatusSelect("been")}
                className="flex-1 rounded bg-blue-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                Been
              </button>
              <button
                onClick={() => handleStatusSelect("planning")}
                className="flex-1 rounded bg-green-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-green-700"
              >
                Planning
              </button>
              <button
                onClick={() => handleStatusSelect("dreaming")}
                className="flex-1 rounded bg-purple-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-purple-700"
              >
                Dreaming
              </button>
            </div>
          </div>
        </Popup>
      )}
    </MapGL>
  );
}
