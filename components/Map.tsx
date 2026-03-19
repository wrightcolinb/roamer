'use client'

import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'
import MapGL, { Marker, type MapRef } from 'react-map-gl/mapbox'
import type { MapMouseEvent } from 'react-map-gl/mapbox'
import type mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Destination } from '@/lib/types'
import { getPinState } from '@/lib/mapUtils'
import Pin from '@/components/Pin'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

interface MapProps {
  destinations: Destination[]
  addPlaceMode?: boolean
  onPinClick?: (destination: Destination) => void
  onMapClick?: () => void
  onAddPlaceClick?: (lat: number, lng: number) => void
}

export interface MapHandle {
  flyTo: (lng: number, lat: number, zoom?: number) => void
  getCanvas: () => HTMLCanvasElement | undefined
  getMap: () => mapboxgl.Map | undefined
}

const Map = forwardRef<MapHandle, MapProps>(function Map(
  { destinations, addPlaceMode, onPinClick, onMapClick, onAddPlaceClick },
  ref
) {
  const mapRef = useRef<MapRef>(null)

  useImperativeHandle(ref, () => ({
    flyTo(lng: number, lat: number, zoom = 6) {
      mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 1500 })
    },
    getCanvas() {
      return mapRef.current?.getMap()?.getCanvas()
    },
    getMap() {
      return mapRef.current?.getMap()
    },
  }))

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      if (e.originalEvent.defaultPrevented) return

      if (addPlaceMode) {
        onAddPlaceClick?.(e.lngLat.lat, e.lngLat.lng)
      } else {
        onMapClick?.()
      }
    },
    [addPlaceMode, onMapClick, onAddPlaceClick]
  )

  return (
    <MapGL
      ref={mapRef}
      initialViewState={{
        longitude: 20,
        latitude: 20,
        zoom: 2,
      }}
      projection={{ name: 'mercator' }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      mapboxAccessToken={MAPBOX_TOKEN}
      style={{ width: '100%', height: '100%' }}
      preserveDrawingBuffer={true}
      cursor={addPlaceMode ? 'crosshair' : undefined}
      onClick={handleMapClick}
    >
      {destinations.map((dest) => (
        <Marker
          key={dest.id}
          longitude={dest.lng}
          latitude={dest.lat}
          anchor="center"
          onClick={(e) => {
            e.originalEvent.preventDefault()
            e.originalEvent.stopPropagation()
            onPinClick?.(dest)
          }}
        >
          <Pin
            state={getPinState(dest)}
            hasIntent={!!dest.intent && dest.visits.length > 0}
          />
        </Marker>
      ))}
    </MapGL>
  )
})

export default Map
