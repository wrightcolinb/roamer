'use client'

import { useState } from 'react'
import type { VisitType, IntentState, AddPlaceData } from '@/lib/types'

interface AddPlaceModalProps {
  placeName: string
  coordinates: { lat: number; lng: number }
  initialTab?: 'visit' | 'intent'
  onSave: (data: AddPlaceData) => void
  onClose: () => void
}

const MONTHS = [
  { value: 0, label: 'Month' },
  { value: 1, label: 'Jan' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' }, { value: 5, label: 'May' }, { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' }, { value: 8, label: 'Aug' }, { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dec' },
]

function MonthYearInput({
  label,
  year,
  month,
  onYearChange,
  onMonthChange,
}: {
  label: string
  year: string
  month: number
  onYearChange: (v: string) => void
  onMonthChange: (v: number) => void
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-stone-500">{label}</label>
      <div className="flex gap-2">
        <select
          value={month}
          onChange={(e) => onMonthChange(Number(e.target.value))}
          className="w-24 rounded-lg border border-stone-200 bg-white px-2 py-2 text-sm text-stone-700 focus:border-stone-400 focus:outline-none"
        >
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Year"
          value={year}
          onChange={(e) => onYearChange(e.target.value)}
          className="w-24 rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-700 placeholder:text-stone-300 focus:border-stone-400 focus:outline-none"
        />
      </div>
    </div>
  )
}

export default function AddPlaceModal({ placeName, initialTab, onSave, onClose }: AddPlaceModalProps) {
  const [tab, setTab] = useState<'visit' | 'intent'>(initialTab ?? 'visit')

  // Visit fields
  const [visitType, setVisitType] = useState<VisitType>('visited')
  const [yearStart, setYearStart] = useState('')
  const [monthStart, setMonthStart] = useState(0)
  const [yearEnd, setYearEnd] = useState('')
  const [monthEnd, setMonthEnd] = useState(0)
  const [visitNotes, setVisitNotes] = useState('')

  // Intent fields
  const [intentState, setIntentState] = useState<IntentState>('on my list')
  const [targetYear, setTargetYear] = useState('')
  const [intentNotes, setIntentNotes] = useState('')

  function handleSave() {
    if (tab === 'visit') {
      onSave({
        mode: 'visit',
        type: visitType,
        year_start: yearStart ? Number(yearStart) : undefined,
        month_start: monthStart || undefined,
        year_end: yearEnd ? Number(yearEnd) : undefined,
        month_end: monthEnd || undefined,
        notes: visitNotes,
      })
    } else {
      onSave({
        mode: 'intent',
        state: intentState,
        target_year: targetYear ? Number(targetYear) : undefined,
        notes: intentNotes,
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-stone-100 px-6 pb-4 pt-6">
          <h2 className="text-lg font-semibold text-stone-900">{placeName}</h2>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-stone-100">
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === 'visit'
                ? 'border-b-2 border-stone-900 text-stone-900'
                : 'text-stone-400 hover:text-stone-600'
            }`}
            onClick={() => setTab('visit')}
          >
            I&apos;ve been here
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === 'intent'
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-stone-400 hover:text-stone-600'
            }`}
            onClick={() => setTab('intent')}
          >
            I want to go here
          </button>
        </div>

        {/* Form body */}
        <div className="space-y-4 px-6 py-5">
          {tab === 'visit' ? (
            <>
              {/* Visit type toggle */}
              <div className="flex gap-2">
                {(['visited', 'lived'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setVisitType(t)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                      visitType === t
                        ? t === 'visited'
                          ? 'bg-red-50 text-coral'
                          : 'bg-green-50 text-emerald-700'
                        : 'bg-stone-100 text-stone-400 hover:text-stone-600'
                    }`}
                  >
                    {t === 'visited' ? 'Visited' : 'Lived'}
                  </button>
                ))}
              </div>

              {/* Date fields */}
              <div className="flex gap-4">
                <MonthYearInput
                  label={visitType === 'lived' ? 'From' : 'When'}
                  year={yearStart}
                  month={monthStart}
                  onYearChange={setYearStart}
                  onMonthChange={setMonthStart}
                />
                {visitType === 'lived' && (
                  <MonthYearInput
                    label="To"
                    year={yearEnd}
                    month={monthEnd}
                    onYearChange={setYearEnd}
                    onMonthChange={setMonthEnd}
                  />
                )}
              </div>

              {/* Notes */}
              <textarea
                placeholder="Notes about this visit…"
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-700 placeholder:text-stone-300 focus:border-stone-400 focus:outline-none"
              />
            </>
          ) : (
            <>
              {/* Intent state toggle */}
              <div className="flex gap-2">
                {(['on my list', 'planning'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setIntentState(s)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                      intentState === s
                        ? s === 'planning'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-purple-50 text-purple-500'
                        : 'bg-stone-100 text-stone-400 hover:text-stone-600'
                    }`}
                  >
                    {s === 'on my list' ? 'On my list' : 'Actively Planning'}
                  </button>
                ))}
              </div>

              {/* Target year */}
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-500">Target year</label>
                <input
                  type="number"
                  placeholder="Year"
                  value={targetYear}
                  onChange={(e) => setTargetYear(e.target.value)}
                  className="w-28 rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-700 placeholder:text-stone-300 focus:border-stone-400 focus:outline-none"
                />
              </div>

              {/* Notes */}
              <textarea
                placeholder="Notes about this plan…"
                value={intentNotes}
                onChange={(e) => setIntentNotes(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-700 placeholder:text-stone-300 focus:border-stone-400 focus:outline-none"
              />
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-stone-100 px-6 pb-6 pt-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-stone-200 py-2.5 text-sm font-medium text-stone-500 hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-xl bg-stone-900 py-2.5 text-sm font-semibold text-white hover:bg-stone-800"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
