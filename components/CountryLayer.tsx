'use client'

import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl'
import { Country, MapMode } from '@/lib/types'

const VISITED_COLOR = '#E8735A'
const LIVED_COLOR = '#2D6A4F'
const DEFAULT_COLOR = '#D8D4C8'

interface CountryLayerProps {
  countries: Country[]
  mode: MapMode
}

export default function CountryLayer({ countries, mode }: CountryLayerProps) {
  /**
   * Builds a Mapbox GL "match" expression that maps each country's
   * ISO code to its fill color. The expression evaluates per-feature
   * at render time, so Mapbox handles the coloring in the GPU —
   * we don't need to loop through countries ourselves on every frame.
   *
   * Shape: ['match', ['get', 'iso_3166_1'], 'ES', '#E8735A', 'FR', '#2D6A4F', ..., '#D8D4C8']
   *        ^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^
   *        operator  input (read ISO code)   code/color pairs                     fallback
   */
  const fillColor = useMemo(() => {
    if (countries.length === 0) return DEFAULT_COLOR

    const expr: any[] = ['match', ['get', 'iso_3166_1']]
    for (const c of countries) {
      expr.push(c.country_code)
      expr.push(c.status === 'lived' ? LIVED_COLOR : VISITED_COLOR)
    }
    expr.push(DEFAULT_COLOR)
    return expr
  }, [countries])

  const countryFillLayer = {
    id: 'country-fills',
    type: 'fill' as const,
    'source-layer': 'country_boundaries',
    filter: [
      'any',
      ['==', ['get', 'worldview'], 'all'],
      ['in', 'US', ['get', 'worldview']],
    ],
    paint: {
      'fill-color': fillColor,
      'fill-opacity': 0.6,
    },
  }

  return (
    <Source
      id="country-boundaries"
      type="vector"
      url="mapbox://mapbox.country-boundaries-v1"
    >
      <Layer {...countryFillLayer} beforeId="admin-0-boundary-bg" />
    </Source>
  )
}
