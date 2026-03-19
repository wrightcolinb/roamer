export type VisitType = 'visited' | 'lived'
export type IntentState = 'on my list' | 'planning'
export type Continent = 'Africa' | 'Asia' | 'Europe' | 'North America' | 'South America' | 'Oceania' | 'Antarctica'

export interface Destination {
  id: string
  name: string
  place_id?: string
  lat: number
  lng: number
  country?: string
  continent?: Continent
  created_at: string
  visits: Visit[]
  intent?: Intent
}

export interface Visit {
  id: string
  destination_id: string
  type: VisitType
  year_start?: number
  month_start?: number
  year_end?: number
  month_end?: number
  notes: string
  created_at: string
}

export interface Intent {
  id: string
  destination_id: string
  state: IntentState
  target_year?: number
  notes: string
  created_at: string
}

export type PinState = 'lived' | 'visited' | 'planning' | 'on my list'

export type AddPlaceVisitData = {
  mode: 'visit'
  type: VisitType
  year_start?: number
  month_start?: number
  year_end?: number
  month_end?: number
  notes: string
}

export type AddPlaceIntentData = {
  mode: 'intent'
  state: IntentState
  target_year?: number
  notes: string
}

export type AddPlaceData = AddPlaceVisitData | AddPlaceIntentData
