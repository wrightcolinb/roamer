import type { LucideIcon } from 'lucide-react'
import {
  Anchor,
  Camera,
  Church,
  Croissant,
  Drama,
  Dumbbell,
  Hotel,
  Landmark,
  MapPin,
  Palette,
  ShoppingBag,
  TrainFront,
  TreePine,
  Utensils,
  Waves,
  Wine,
} from 'lucide-react'
import type { PlaceCategoryId } from '@/lib/placeCategory'
import { normalizePlaceCategoryStored } from '@/lib/placeCategory'

const ICONS: Record<PlaceCategoryId, LucideIcon> = {
  utensils: Utensils,
  landmark: Landmark,
  hotel: Hotel,
  tree: TreePine,
  waves: Waves,
  church: Church,
  shopping: ShoppingBag,
  wine: Wine,
  drama: Drama,
  train: TrainFront,
  palette: Palette,
  dumbbell: Dumbbell,
  camera: Camera,
  croissant: Croissant,
  anchor: Anchor,
  pin: MapPin,
}

export function PlaceCategoryIcon({
  category,
  className = 'text-gray-400',
  size = 16,
}: {
  category: string | null | undefined
  className?: string
  size?: number
}) {
  const id = normalizePlaceCategoryStored(category)
  const Icon = ICONS[id] ?? MapPin
  return (
    <Icon
      className={`shrink-0 ${className}`.trim()}
      size={size}
      aria-hidden
      strokeWidth={1.75}
    />
  )
}
