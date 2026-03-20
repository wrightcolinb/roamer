'use client'

import { useState } from 'react'
import { Visit, VisitType } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { formatVisitDate, monthName } from '@/lib/formatUtils'

interface VisitCardProps {
  visit: Visit
  onChange: (updated: Visit) => void
  onDelete: (visitId: string) => void
}

const TYPE_COLORS: Record<VisitType, { bg: string; text: string }> = {
  visited: { bg: 'bg-[#E8735A]', text: 'text-white' },
  lived: { bg: 'bg-[#2D6A4F]', text: 'text-white' },
}

const TYPE_LABELS: Record<VisitType, string> = {
  visited: 'Visited',
  lived: 'Lived',
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

export default function VisitCard({ visit, onChange, onDelete }: VisitCardProps) {
  const [editing, setEditing] = useState(false)

  const [editType, setEditType] = useState<VisitType>(visit.type)
  const [editMonthStart, setEditMonthStart] = useState<number | undefined>(visit.month_start)
  const [editYearStart, setEditYearStart] = useState(visit.year_start?.toString() ?? '')
  const [editMonthEnd, setEditMonthEnd] = useState<number | undefined>(visit.month_end)
  const [editYearEnd, setEditYearEnd] = useState(visit.year_end?.toString() ?? '')
  const [editNotes, setEditNotes] = useState(visit.notes ?? '')

  function openEdit() {
    setEditType(visit.type)
    setEditMonthStart(visit.month_start)
    setEditYearStart(visit.year_start?.toString() ?? '')
    setEditMonthEnd(visit.month_end)
    setEditYearEnd(visit.year_end?.toString() ?? '')
    setEditNotes(visit.notes ?? '')
    setEditing(true)
  }

  async function handleSave() {
    const parsedYearStart = editYearStart ? parseInt(editYearStart, 10) : null
    const parsedYearEnd = editYearEnd ? parseInt(editYearEnd, 10) : null

    const updates = {
      type: editType,
      month_start: editMonthStart ?? null,
      year_start: parsedYearStart,
      month_end: editType === 'lived' ? (editMonthEnd ?? null) : null,
      year_end: editType === 'lived' ? parsedYearEnd : null,
      notes: editNotes,
    }

    const { data } = await supabase
      .from('visits')
      .update(updates)
      .eq('id', visit.id)
      .select()
      .single()

    if (data) {
      onChange(data)
      setEditing(false)
    }
  }

  async function handleDelete() {
    await supabase.from('visits').delete().eq('id', visit.id)
    onDelete(visit.id)
  }

  const colors = TYPE_COLORS[visit.type]
  const dateStr = formatVisitDate(visit)

  // ── Display mode ───────────────────────────────────────────────────
  if (!editing) {
    return (
      <div className="border border-gray-100 rounded-xl p-3 bg-gray-50 group">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
            >
              {TYPE_LABELS[visit.type]}
            </span>
            {dateStr && (
              <span className="text-sm text-gray-600">{dateStr}</span>
            )}
          </div>
          <button
            onClick={openEdit}
            className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Edit visit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
            </svg>
          </button>
        </div>
        {visit.notes && (
          <p className="text-sm text-gray-500 mt-1.5 whitespace-pre-line">{visit.notes}</p>
        )}
      </div>
    )
  }

  // ── Edit mode ──────────────────────────────────────────────────────
  return (
    <div className="border border-gray-300 rounded-xl p-3 bg-white shadow-sm">
      {/* Type toggle */}
      <div className="flex gap-1 mb-3">
        {(['visited', 'lived'] as VisitType[]).map((t) => (
          <button
            key={t}
            onClick={() => setEditType(t)}
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
              editType === t
                ? `${TYPE_COLORS[t].bg} ${TYPE_COLORS[t].text}`
                : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Month + Year — start */}
      <div className="flex gap-2 mb-2">
        <div className="w-28">
          <label className="block text-xs text-gray-400 mb-1">Month</label>
          <select
            value={editMonthStart ?? ''}
            onChange={(e) => setEditMonthStart(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 bg-white"
          >
            <option value="">—</option>
            {MONTHS.map((m) => (
              <option key={m} value={m}>{monthName(m)}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-400 mb-1">
            {editType === 'lived' ? 'From year' : 'Year'}
          </label>
          <input
            type="number"
            value={editYearStart}
            onChange={(e) => setEditYearStart(e.target.value)}
            min="1900"
            max="2100"
            placeholder="Year"
            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 bg-white"
          />
        </div>
      </div>

      {/* Month + Year — end (lived only) */}
      {editType === 'lived' && (
        <div className="flex gap-2 mb-2">
          <div className="w-28">
            <label className="block text-xs text-gray-400 mb-1">End month</label>
            <select
              value={editMonthEnd ?? ''}
              onChange={(e) => setEditMonthEnd(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 bg-white"
            >
              <option value="">—</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>{monthName(m)}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">To year</label>
            <input
              type="number"
              value={editYearEnd}
              onChange={(e) => setEditYearEnd(e.target.value)}
              min="1900"
              max="2100"
              placeholder="Present"
              className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 bg-white"
            />
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="mb-3">
        <label className="block text-xs text-gray-400 mb-1">Notes</label>
        <textarea
          value={editNotes}
          onChange={(e) => setEditNotes(e.target.value)}
          rows={2}
          placeholder="What was it like?"
          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 bg-white resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          className="px-3 py-1.5 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
        >
          Delete
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setEditing(false)}
          className="px-3 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-1.5 text-sm text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  )
}
