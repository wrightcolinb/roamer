import { Continent, Destination } from '@/lib/types'

export interface FriendCountryActivityRow {
  destination_name: string
  place_id: string | null
  country_code: string
  country_name: string | null
  lat: number
  lng: number
  continent: string | null
  author_id: string
  display_name: string
  note_count: number
  visit_label: string | null
}

function toNoteCount(v: unknown): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  if (typeof v === 'string') return parseInt(v, 10) || 0
  if (typeof v === 'bigint') return Number(v)
  return 0
}

function toNumber(v: unknown, fallback: number): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  if (typeof v === 'string') {
    const n = parseFloat(v)
    return Number.isNaN(n) ? fallback : n
  }
  return fallback
}

export function mapFriendCountryActivityRow(row: {
  destination_name: string
  place_id?: string | null
  country_code: string
  country_name?: string | null
  lat?: unknown
  lng?: unknown
  continent?: string | null
  author_id: string
  display_name: string
  note_count: unknown
  visit_label?: string | null
}): FriendCountryActivityRow {
  return {
    destination_name: row.destination_name,
    place_id: row.place_id ?? null,
    country_code: row.country_code,
    country_name: row.country_name ?? null,
    lat: toNumber(row.lat, 0),
    lng: toNumber(row.lng, 0),
    continent: row.continent ?? null,
    author_id: row.author_id,
    display_name: row.display_name,
    note_count: toNoteCount(row.note_count),
    visit_label: row.visit_label ?? null,
  }
}

export function friendLocationGroupKey(
  placeId: string | null | undefined,
  name: string,
  countryCode: string
): string {
  const pid = placeId?.trim()
  if (pid) return `pid:${pid}`
  return `name:${name.trim().toLowerCase()}|${countryCode}`
}

export interface FriendInLocationGroup {
  authorId: string
  displayName: string
  visitLabel: string | null
}

export interface FriendLocationGroup {
  key: string
  destinationName: string
  placeId: string | undefined
  countryCode: string
  countryName: string | undefined
  lat: number
  lng: number
  continent: Continent | undefined
  totalFriendNotes: number
  friends: FriendInLocationGroup[]
}

/** Opens the destination sidebar from a friend location before the viewer has their own pin. */
export interface FriendLocationSidebarPreview {
  groupKey: string
  name: string
  placeId?: string
  countryCode: string
  countryName?: string
  lat: number
  lng: number
  continent?: Continent
}

export function friendGroupToSidebarPreview(group: FriendLocationGroup): FriendLocationSidebarPreview {
  return {
    groupKey: group.key,
    name: group.destinationName,
    placeId: group.placeId,
    countryCode: group.countryCode,
    countryName: group.countryName,
    lat: group.lat,
    lng: group.lng,
    continent: group.continent,
  }
}

export function buildFriendLocationGroups(rows: FriendCountryActivityRow[]): FriendLocationGroup[] {
  const map = new Map<string, FriendLocationGroup>()
  for (const row of rows) {
    const key = friendLocationGroupKey(row.place_id, row.destination_name, row.country_code)
    let g = map.get(key)
    if (!g) {
      const cont = row.continent?.trim()
      g = {
        key,
        destinationName: row.destination_name,
        placeId: row.place_id?.trim() || undefined,
        countryCode: row.country_code,
        countryName: row.country_name?.trim() || undefined,
        lat: row.lat,
        lng: row.lng,
        continent: cont ? (cont as Continent) : undefined,
        totalFriendNotes: 0,
        friends: [],
      }
      map.set(key, g)
    }
    if (!g.countryName && row.country_name?.trim()) g.countryName = row.country_name.trim()
    if (!g.continent && row.continent?.trim()) g.continent = row.continent.trim() as Continent
    g.totalFriendNotes += row.note_count
    if (!g.friends.some((f) => f.authorId === row.author_id)) {
      g.friends.push({
        authorId: row.author_id,
        displayName: row.display_name,
        visitLabel: row.visit_label,
      })
    }
  }
  const groups = Array.from(map.values())
  groups.sort((a, b) => {
    if (b.totalFriendNotes !== a.totalFriendNotes) return b.totalFriendNotes - a.totalFriendNotes
    return a.destinationName.localeCompare(b.destinationName)
  })
  for (const g of groups) {
    g.friends.sort((a, b) => a.displayName.localeCompare(b.displayName))
  }
  return groups
}

/** Match aggregated friend location to the signed-in user's destination in this country. */
export function resolveViewerDestinationForFriendGroup(
  group: FriendLocationGroup,
  countryDests: Destination[]
): Destination | null {
  if (group.placeId) {
    const byPlace = countryDests.find((d) => d.place_id && d.place_id === group.placeId)
    if (byPlace) return byPlace
  }
  const norm = (s: string) => s.trim().toLowerCase()
  const target = norm(group.destinationName)
  return countryDests.find((d) => norm(d.name) === target) ?? null
}
