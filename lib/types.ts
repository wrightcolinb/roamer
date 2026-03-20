export type VisitType = 'visited' | 'lived'
export type PinState = 'visited' | 'lived' | 'next_up'
export type CountryStatus = 'visited' | 'lived'
export type Sentiment = 'recommend' | 'meh' | 'skip'
export type Continent = 'Africa' | 'Asia' | 'Europe' | 'North America' | 'South America' | 'Oceania' | 'Antarctica'
export type MapMode = 'fill' | 'explore'

export interface Country {
  id: string
  country_code: string
  country_name: string
  continent?: Continent
  status: CountryStatus
  created_at: string
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

export interface Destination {
  id: string
  name: string
  place_id?: string
  lat: number
  lng: number
  country_code?: string
  country_name?: string
  continent?: Continent
  next_up: boolean
  next_up_year?: number
  created_at: string
  visits: Visit[]
  place_notes?: PlaceNote[]
}

export interface PlaceNote {
  id: string
  destination_id: string
  place_name: string
  place_id?: string
  sentiment: Sentiment
  category_emoji: string
  note: string
  created_at: string
}
