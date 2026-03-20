'use client'

import { useState } from 'react'
import { Visit, VisitType } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { monthName } from '@/lib/formatUtils'

interface AddVisitFormProps {
  destinationId: string
  onSave: (visit: Visit) => void
  onCancel: () => void
}

const TYPE_COLORS: Record<VisitType, string> = {
  visited: 'bg-[#E8735A] text-white',
  lived: 'bg-[#2D6A4F] text-white',
}

const TYPE_LABELS: Record<VisitType, string> = {
  visited: 'Visited',
  lived: 'Lived',
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

export default function AddVisitForm({ destinationId, onSave, onCancel }: AddVisitFormProps) {
  const [type, setType] = useState<VisitType>('visited')
  const [monthStart, setMonthStart] = useState<number | undefined>(undefined)
  const [yearStart, setYearStart] = useState('')
  const [monthEnd, setMonthEnd] = useState<number | undefined>(undefined)
  const [yearEnd, setYearEnd] = useState('')
  const [notes, setNotes] = useState('')

  async function handleSave() {
    const parsedYearStart = yearStart ? parseInt(yearStart, 10) : undefined
    const parsedYearEnd = yearEnd ? parseInt(yearEnd, 10) : undefined

    const { data } = await supabase
      .from('visits')
      .insert({
        destination_id: destinationId,
        type,
        month_start: monthStart ?? null,
        year_start: parsedYearStart,
        month_end: type === 'lived' ? (monthEnd ?? null) : null,
        year_end: type === 'lived' ? parsedYearEnd : undefined,
        notes,
      })
      .select()
      .single()

    if (data) onSave(data)
  }

  return (
    <div className="mt-3 border border-gray-200 rounded-xl p-3">
      {/* Type toggle */}
      <div className="flex gap-1 mb-3">
        {(['visited', 'lived'] as VisitType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              type === t
                ? TYPE_COLORS[t]
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
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
            value={monthStart ?? ''}
            onChange={(e) => setMonthStart(e.target.value ? Number(e.target.value) : undefined)}
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
            {type === 'lived' ? 'From year' : 'Year'}
          </label>
          <input
            type="number"
            value={yearStart}
            onChange={(e) => setYearStart(e.target.value)}
            placeholder="Year"
            min="1900"
            max="2100"
            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
          />
        </div>
      </div>

      {/* Month + Year — end (lived only) */}
      {type === 'lived' && (
        <div className="flex gap-2 mb-2">
          <div className="w-28">
            <label className="block text-xs text-gray-400 mb-1">End month</label>
            <select
              value={monthEnd ?? ''}
              onChange={(e) => setMonthEnd(e.target.value ? Number(e.target.value) : undefined)}
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
              value={yearEnd}
              onChange={(e) => setYearEnd(e.target.value)}
              placeholder="Present"
              min="1900"
              max="2100"
              className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
            />
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="mb-3">
        <label className="block text-xs text-gray-400 mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="What was it like?"
          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-1.5 text-sm text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  )
}
