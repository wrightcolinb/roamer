import { FriendPlaceNote, Sentiment } from '@/lib/types'

/** Maps rows from get_friend_notes / get_friend_notes_for_country RPCs. */
export function mapFriendNoteRpcRow(row: {
  id: string
  place_name: string
  note: string
  sentiment: string
  display_name: string
  visit_year?: number | null
  author_id?: string | null
  destination_name?: string | null
  created_at?: string | null
  category_emoji?: string | null
}): FriendPlaceNote {
  return {
    id: row.id,
    place_name: row.place_name,
    note: row.note,
    sentiment: row.sentiment as Sentiment,
    display_name: row.display_name,
    visit_year: row.visit_year ?? undefined,
    author_id: row.author_id ?? row.display_name,
    destination_name: row.destination_name ?? undefined,
    created_at: row.created_at ?? undefined,
    category_emoji: row.category_emoji?.trim() || 'pin',
  }
}
