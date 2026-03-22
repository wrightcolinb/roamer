export interface User {
  id: string
  slug: string
  display_name: string
}

export type VisitType = 'visited' | 'lived'
/** `hidden` = on your map as a row but no visits and not Next Up — no pin is drawn (e.g. draft from friend explore). */
export type PinState = 'visited' | 'lived' | 'next_up' | 'hidden'
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
  user_id: string
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

/** Row from get_friend_notes / get_friend_notes_for_country RPCs (other users' notes). */
export interface FriendPlaceNote {
  id: string
  place_name: string
  note: string
  sentiment: Sentiment
  display_name: string
  visit_year?: number
  author_id: string
  destination_name?: string
  created_at?: string
  category_emoji: string
}

