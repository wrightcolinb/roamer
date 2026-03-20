'use client'

import { useState, useRef, useEffect } from 'react'
import { PlaceNote, Sentiment } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { SENTIMENT_QUOTE_COLORS, CATEGORY_EMOJI_OPTIONS } from '@/lib/mapUtils'

interface PlaceNoteCardProps {
  note: PlaceNote
  onChange: (updated: PlaceNote) => void
  onDelete: (noteId: string) => void
}

const SENTIMENT_OPTS: { value: Sentiment; label: string; color: string; bg: string }[] = [
  { value: 'recommend', label: 'Recommend', color: '#1D9E75', bg: 'rgba(29, 158, 117, 0.12)' },
  { value: 'meh', label: 'Meh', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.12)' },
  { value: 'skip', label: 'Skip', color: '#D85A30', bg: 'rgba(216, 90, 48, 0.12)' },
]

export default function PlaceNoteCard({ note, onChange, onDelete }: PlaceNoteCardProps) {
  const [editing, setEditing] = useState(false)
  const [editSentiment, setEditSentiment] = useState<Sentiment>(note.sentiment)
  const [editNote, setEditNote] = useState(note.note)
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!pickerOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [pickerOpen])

  function openEdit() {
    setEditSentiment(note.sentiment)
    setEditNote(note.note)
    setEditing(true)
  }

  async function handleSave() {
    const { data } = await supabase
      .from('place_notes')
      .update({ sentiment: editSentiment, note: editNote })
      .eq('id', note.id)
      .select()
      .single()
    if (data) {
      onChange(data)
      setEditing(false)
    }
  }

  async function handleDelete() {
    await supabase.from('place_notes').delete().eq('id', note.id)
    onDelete(note.id)
  }

  async function handleEmojiPick(emoji: string) {
    setPickerOpen(false)
    const { data } = await supabase
      .from('place_notes')
      .update({ category_emoji: emoji })
      .eq('id', note.id)
      .select()
      .single()
    if (data) onChange(data)
  }

  const quoteColor = SENTIMENT_QUOTE_COLORS[note.sentiment]

  // ── Display mode ───────────────────────────────────────────────────
  if (!editing) {
    return (
      <div className="flex items-start gap-2.5 py-2 group">
        {/* Category emoji — tappable */}
        <div className="relative shrink-0 w-[16px]" ref={pickerRef}>
          <button
            onClick={() => setPickerOpen((p) => !p)}
            className="text-base leading-none mt-0.5 hover:scale-110 transition-transform cursor-pointer"
            aria-label="Change category"
          >
            {note.category_emoji || '📍'}
          </button>

          {pickerOpen && (
            <div className="absolute top-7 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-2 grid grid-cols-4 gap-1 w-[160px]">
              {CATEGORY_EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => handleEmojiPick(e)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg hover:bg-gray-100 transition-colors ${
                    note.category_emoji === e ? 'bg-gray-100 ring-1 ring-gray-300' : ''
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Name + quote */}
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium text-gray-800 leading-snug">{note.place_name}</p>
          {note.note && (
            <p
              className="text-[13px] italic leading-snug mt-0.5"
              style={{ color: quoteColor }}
            >
              &ldquo;{note.note}&rdquo;
            </p>
          )}
        </div>

        {/* Edit icon */}
        <button
          onClick={openEdit}
          className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors opacity-0 group-hover:opacity-100 mt-1"
          aria-label="Edit place note"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
          </svg>
        </button>
      </div>
    )
  }

  // ── Edit mode ──────────────────────────────────────────────────────
  return (
    <div className="border border-gray-300 rounded-xl p-3 bg-white shadow-sm my-1">
      <p className="text-[14px] font-medium text-gray-800 mb-2">{note.place_name}</p>

      {/* Sentiment selector — colored text labels, no emojis */}
      <div className="flex gap-1.5 mb-2">
        {SENTIMENT_OPTS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setEditSentiment(opt.value)}
            className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
            style={{
              color: opt.color,
              backgroundColor: editSentiment === opt.value ? opt.bg : 'transparent',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Note text */}
      <input
        type="text"
        value={editNote}
        onChange={(e) => setEditNote(e.target.value)}
        placeholder="What did you think?"
        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 mb-2"
      />

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          className="px-3 py-1 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
        >
          Delete
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setEditing(false)}
          className="px-3 py-1 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-3 py-1 text-xs text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  )
}
