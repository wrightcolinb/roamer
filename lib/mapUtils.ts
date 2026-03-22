import { formatMonthYearComma } from '@/lib/formatUtils'
import { CountryStatus, Destination, PinState, Sentiment, Visit, VisitType } from '@/lib/types'

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

/** Descending recency: higher score = more recent. */
function visitedRecencyScore(v: Visit): number {
  if (v.year_start != null) {
    const m = v.month_start != null && v.month_start >= 1 && v.month_start <= 12 ? v.month_start : 0
    return v.year_start * 13 + m
  }
  const t = Date.parse(v.created_at)
  return Number.isFinite(t) ? t : 0
}

/** Descending recency for lived stints (end of stay preferred). */
function livedRecencyScore(v: Visit): number {
  const y = v.year_end ?? v.year_start
  if (y == null) {
    const t = Date.parse(v.created_at)
    return Number.isFinite(t) ? t : 0
  }
  const m =
    v.year_end != null
      ? v.month_end != null && v.month_end >= 1 && v.month_end <= 12
        ? v.month_end
        : 12
      : v.month_start != null && v.month_start >= 1 && v.month_start <= 12
        ? v.month_start
        : 12
  return y * 13 + m
}

function pickMostRecentVisit(visits: Visit[], score: (v: Visit) => number): Visit | null {
  if (!visits.length) return null
  return visits.reduce((best, v) => (score(v) >= score(best) ? v : best))
}

/** Higher = more recent on the timeline (for sidebar history + country-panel “most recent”). */
function visitHistorySortKey(v: Visit): number {
  if (v.type === 'lived') return livedRecencyScore(v)
  return visitedRecencyScore(v)
}

/**
 * Destination sidebar: newest first. Uses year, then month when present; within the same calendar
 * year, a dated visit (any month) sorts above a year-only visit.
 */
export function sortVisitsReverseChronological(visits: Visit[]): Visit[] {
  return [...visits].sort((a, b) => {
    const ka = visitHistorySortKey(a)
    const kb = visitHistorySortKey(b)
    if (ka !== kb) return kb - ka
    return Date.parse(b.created_at) - Date.parse(a.created_at)
  })
}

export interface CountryPanelDestinationLines {
  /** Lived summary; shown above visit line when present. */
  livedLine: string | null
  /** Visit count + most recent (visited-type only). */
  visitedLine: string | null
  /** When there are no visit rows but destination is Next Up. */
  nextUpLine: string | null
}

/**
 * Subtext for destination rows in the country panel: lived (if any), then visits (if any),
 * else Next Up when applicable.
 */
export function getCountryPanelDestinationLines(d: Destination): CountryPanelDestinationLines {
  const livedVisits = d.visits.filter((v) => v.type === 'lived')
  const tripVisits = d.visits.filter((v) => v.type === 'visited')

  let livedLine: string | null = null
  if (livedVisits.length > 0) {
    const mostLived = pickMostRecentVisit(livedVisits, livedRecencyScore)!
    const y = mostLived.year_end ?? mostLived.year_start
    const yearLabel = y != null ? `${y}` : ''
    if (livedVisits.length === 1) {
      livedLine = yearLabel ? `Lived ${yearLabel}` : 'Lived'
    } else {
      livedLine = yearLabel
        ? `Lived ${livedVisits.length} times, most recently ${yearLabel}`
        : `Lived ${livedVisits.length} times`
    }
  }

  let visitedLine: string | null = null
  if (tripVisits.length > 0) {
    const most = pickMostRecentVisit(tripVisits, visitedRecencyScore)!
    const recent = formatMonthYearComma(most.year_start, most.month_start)
    if (tripVisits.length === 1) {
      visitedLine = recent ? `Visited · ${recent}` : 'Visited'
    } else {
      visitedLine = recent
        ? `Visited ${tripVisits.length} times, most recently ${recent}`
        : `Visited ${tripVisits.length} times`
    }
  }

  let nextUpLine: string | null = null
  if (!livedLine && !visitedLine && d.next_up) {
    nextUpLine = d.next_up_year != null ? `Next up · ${d.next_up_year}` : 'Next up'
  }

  return { livedLine, visitedLine, nextUpLine }
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
