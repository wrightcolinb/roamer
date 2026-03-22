'use client'

import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'
import MapGL, { Marker, MapLayerMouseEvent, MapRef } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapMode, Country, Destination } from '@/lib/types'
import { getPinState } from '@/lib/mapUtils'
import CountryLayer from '@/components/CountryLayer'
import DestinationPin from '@/components/DestinationPin'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

export interface MapHandle {
  flyTo: (lat: number, lng: number) => void
  getMap: () => ReturnType<MapRef['getMap']> | undefined
}

interface MapProps {
  mode: MapMode
  countries: Country[]
  destinations: Destination[]
  onCountryClick?: (countryCode: string, countryName: string) => void
  onDestinationClick?: (destination: Destination) => void
  onBackgroundClick?: () => void
}

const Map = forwardRef<MapHandle, MapProps>(function Map(
  { mode, countries, destinations, onCountryClick, onDestinationClick, onBackgroundClick },
  ref
) {
  const mapRef = useRef<MapRef>(null)

  useImperativeHandle(ref, () => ({
    flyTo: (lat: number, lng: number) => {
      mapRef.current?.flyTo({
        center: [lng, lat],
        zoom: 8,
        duration: 2000,
      })
    },
    getMap: () => mapRef.current?.getMap(),
  }))

  const handleClick = useCallback((event: MapLayerMouseEvent) => {
    const feature = event.features?.[0]

    if (feature) {
      const countryCode = feature.properties?.iso_3166_1 as string | undefined
      const countryName = feature.properties?.name_en as string | undefined
      if (countryCode && onCountryClick) {
        onCountryClick(countryCode, countryName ?? countryCode)
      }
    } else {
      onBackgroundClick?.()
    }
  }, [onCountryClick, onBackgroundClick])

  function handlePinClick(e: React.MouseEvent, dest: Destination) {
    e.stopPropagation()
    if (mode === 'explore') {
      onDestinationClick?.(dest)
    }
  }

  return (
    <MapGL
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{
        longitude: 20,
        latitude: 20,
        zoom: 2,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      projection={{ name: 'mercator' }}
      preserveDrawingBuffer
      interactiveLayerIds={['country-fills']}
      onClick={handleClick}
      cursor={mode === 'fill' ? 'crosshair' : undefined}
    >
      <CountryLayer countries={countries} mode={mode} />
      {destinations
        .filter((dest) => getPinState(dest) !== 'hidden')
        .map((dest) => (
        <Marker
          key={dest.id}
          longitude={dest.lng}
          latitude={dest.lat}
          anchor="center"
        >
          <div
            onClick={(e) => handlePinClick(e, dest)}
            style={{ cursor: mode === 'explore' ? 'pointer' : undefined }}
          >
            <DestinationPin destination={dest} />
          </div>
        </Marker>
      ))}
    </MapGL>
  )
})

export default Map
