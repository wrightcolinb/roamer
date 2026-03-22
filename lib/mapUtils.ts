import { CountryStatus, Destination, PinState, Sentiment, VisitType } from '@/lib/types'

/**
 * Derives the visual pin state from a destination's visits array and next_up flag.
 * Priority: lived > visited > next_up
 */
export function getPinState(destination: Destination): PinState {
  if (destination.visits.some((v) => v.type === 'lived')) return 'lived'
  if (destination.visits.length > 0) return 'visited'
  if (destination.next_up) return 'next_up'
  return 'hidden'
}

/** Short label for lists (country panel, etc.). */
export function formatPinStateLabel(destination: Destination): string {
  const s = getPinState(destination)
  if (s === 'hidden') return 'No pin yet'
  return s.replace('_', ' ')
}

/**
 * Given all destinations within a single country, returns the highest
 * country status that should apply. lived > visited > null.
 * next_up destinations are ignored — they don't affect country status.
 */
export function getCountryStatus(
  destinations: Destination[]
): CountryStatus | null {
  let hasVisited = false

  for (const d of destinations) {
    const state = getPinState(d)
    if (state === 'lived') return 'lived'
    if (state === 'visited') hasVisited = true
  }

  return hasVisited ? 'visited' : null
}

/**
 * Determines whether adding a visit of `visitType` should change the country record.
 * Returns the new status to write, or null if no promotion is needed.
 *
 * Rules (from spec — status only ever promotes, never demotes):
 *   visited + null    → create as 'visited'
 *   visited + visited/lived → no change
 *   lived   + null/visited  → promote to 'lived'
 *   lived   + lived         → no change
 */
export function shouldPromoteCountry(
  existing: CountryStatus | null,
  visitType: VisitType
): CountryStatus | null {
  if (visitType === 'lived') {
    return existing === 'lived' ? null : 'lived'
  }

  // visitType === 'visited'
  return existing === null ? 'visited' : null
}

const CATEGORY_RULES: [string[], string][] = [
  [['restaurant', 'trattoria', 'osteria', 'cafe', 'bar', 'pizzeria', 'bistro'], '🍕'],
  [['museum', 'gallery', 'art'], '🏛'],
  [['hotel', 'hostel', 'airbnb', 'inn'], '🏨'],
  [['park', 'garden', 'nature', 'trail'], '🌿'],
  [['beach', 'coast', 'bay'], '🏖'],
  [['church', 'cathedral', 'mosque', 'temple', 'basilica'], '⛪'],
  [['market', 'shop', 'store'], '🛍'],
  [['bar', 'club', 'nightlife'], '🍸'],
]

/**
 * Auto-assigns a category emoji based on keyword matching against the place name.
 * Rules are checked in order — the first match wins. Falls back to 📍.
 */
export function getCategoryEmoji(placeName: string): string {
  const lower = placeName.toLowerCase()
  for (const [keywords, emoji] of CATEGORY_RULES) {
    if (keywords.some((k) => lower.includes(k))) return emoji
  }
  return '📍'
}

/** Sentiment → quote text color mapping. */
export const SENTIMENT_QUOTE_COLORS: Record<Sentiment, string> = {
  recommend: '#1D9E75',
  meh: '#6B7280',
  skip: '#E8735A',
}

/** Full emoji picker palette for category overrides. */
export const CATEGORY_EMOJI_OPTIONS = [
  '🍕', '🏛', '🏨', '🌿',
  '🏖', '⛪', '🛍', '🍸',
  '🎭', '🚂', '🍷', '🎨',
  '🏋', '🌄', '🥐', '📍',
]
