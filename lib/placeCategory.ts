/**
 * Place type categories for place notes. Stored in DB column `category_emoji` as stable id strings
 * (legacy rows may still hold emoji — see normalizePlaceCategoryStored).
 */

export const PLACE_CATEGORY_IDS = [
  'utensils',
  'landmark',
  'hotel',
  'tree',
  'waves',
  'church',
  'shopping',
  'wine',
  'drama',
  'train',
  'palette',
  'dumbbell',
  'camera',
  'croissant',
  'anchor',
  'pin',
] as const

export type PlaceCategoryId = (typeof PLACE_CATEGORY_IDS)[number]

const ID_SET = new Set<string>(PLACE_CATEGORY_IDS)

/** Legacy emoji values → category id (existing rows). */
export const LEGACY_CATEGORY_EMOJI_TO_ID: Record<string, PlaceCategoryId> = {
  '🍕': 'utensils',
  '🏛': 'landmark',
  '🏨': 'hotel',
  '🌿': 'tree',
  '🏖': 'waves',
  '⛪': 'church',
  '🛍': 'shopping',
  '🍸': 'wine',
  '🎭': 'drama',
  '🚂': 'train',
  '🍷': 'wine',
  '🎨': 'palette',
  '🏋': 'dumbbell',
  '🌄': 'camera',
  '🥐': 'croissant',
  '📍': 'pin',
}

/** Ordered list for the category picker (4×4 grid). */
export const PLACE_CATEGORY_PICKER_IDS: PlaceCategoryId[] = [
  'utensils',
  'landmark',
  'hotel',
  'tree',
  'waves',
  'church',
  'shopping',
  'wine',
  'drama',
  'train',
  'palette',
  'dumbbell',
  'camera',
  'croissant',
  'anchor',
  'pin',
]

/** Keyword rules — first match wins. */
const CATEGORY_KEYWORD_RULES: { keywords: string[]; id: PlaceCategoryId }[] = [
  {
    keywords: ['restaurant', 'trattoria', 'osteria', 'cafe', 'café', 'pizzeria', 'bistro'],
    id: 'utensils',
  },
  {
    keywords: [
      'museum',
      'gallery',
      'art',
      'historic',
      'ruins',
      'castle',
      'monument',
      'heritage',
      'archaeological',
      'unesco',
    ],
    id: 'landmark',
  },
  { keywords: ['shipwreck', 'wreck', 'diving', 'underwater'], id: 'anchor' },
  { keywords: ['viewpoint', 'lookout', 'panorama', 'scenic', 'overlook'], id: 'camera' },
  { keywords: ['hotel', 'hostel', 'airbnb', 'inn', 'resort', 'lodge'], id: 'hotel' },
  { keywords: ['park', 'garden', 'nature', 'trail', 'forest', 'hike'], id: 'tree' },
  { keywords: ['beach', 'coast', 'bay', 'shore'], id: 'waves' },
  {
    keywords: ['church', 'cathedral', 'mosque', 'temple', 'basilica', 'chapel'],
    id: 'church',
  },
  { keywords: ['market', 'shop', 'store', 'boutique', 'mall'], id: 'shopping' },
  { keywords: ['bar', 'pub', 'club', 'nightlife', 'cocktail'], id: 'wine' },
  { keywords: ['theater', 'theatre', 'opera', 'concert', 'cinema'], id: 'drama' },
  { keywords: ['train', 'railway', 'station', 'metro'], id: 'train' },
  { keywords: ['painting', 'atelier', 'sculpture'], id: 'palette' },
  { keywords: ['gym', 'fitness', 'workout'], id: 'dumbbell' },
  { keywords: ['bakery', 'patisserie', 'pastry'], id: 'croissant' },
]

export function getPlaceCategoryId(placeName: string): PlaceCategoryId {
  const lower = placeName.toLowerCase()
  for (const rule of CATEGORY_KEYWORD_RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) return rule.id
  }
  return 'pin'
}

export function normalizePlaceCategoryStored(
  raw: string | null | undefined
): PlaceCategoryId {
  if (!raw) return 'pin'
  const t = raw.trim()
  if (ID_SET.has(t)) return t as PlaceCategoryId
  const fromEmoji = LEGACY_CATEGORY_EMOJI_TO_ID[t]
  if (fromEmoji) return fromEmoji
  return 'pin'
}
