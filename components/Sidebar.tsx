'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Destination, Visit, Intent, VisitType, IntentState } from '@/lib/types'

interface SidebarProps {
  destination: Destination | null
  onClose: () => void
  onDestinationChange: (updated: Destination) => void
  onDeleteDestination: (id: string) => void
  onAddVisit: () => void
  onAddIntent: () => void
}

const MONTH_NAMES = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const MONTHS_OPTIONS = [
  { value: 0, label: '—' },
  { value: 1, label: 'Jan' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' }, { value: 5, label: 'May' }, { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' }, { value: 8, label: 'Aug' }, { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dec' },
]

function formatDatePoint(year?: number, month?: number): string {
  if (!year) return ''
  if (month) return `${MONTH_NAMES[month]} ${year}`
  return String(year)
}

function formatYearRange(visit: Visit): string {
  const start = formatDatePoint(visit.year_start, visit.month_start)
  const end = formatDatePoint(visit.year_end, visit.month_end)
  if (!start && !end) return ''
  if (start && end && start !== end) return `${start}–${end}`
  return start || end
}

function EditableVisitCard({
  visit,
  destination,
  onDestinationChange,
}: {
  visit: Visit
  destination: Destination
  onDestinationChange: (d: Destination) => void
}) {
  const [notes, setNotes] = useState(visit.notes)
  const [yearStart, setYearStart] = useState(String(visit.year_start ?? ''))
  const [monthStart, setMonthStart] = useState(visit.month_start ?? 0)
  const [yearEnd, setYearEnd] = useState(String(visit.year_end ?? ''))
  const [monthEnd, setMonthEnd] = useState(visit.month_end ?? 0)

  function replaceVisit(updated: Visit) {
    onDestinationChange({
      ...destination,
      visits: destination.visits.map((v) => (v.id === updated.id ? updated : v)),
    })
  }

  async function handleTypeChange(newType: VisitType) {
    const { error } = await supabase
      .from('visits').update({ type: newType }).eq('id', visit.id)
    if (!error) replaceVisit({ ...visit, type: newType })
  }

  async function handleNotesBlur() {
    if (notes === visit.notes) return
    const { error } = await supabase
      .from('visits').update({ notes }).eq('id', visit.id)
    if (!error) replaceVisit({ ...visit, notes })
  }

  async function handleYearStartBlur() {
    const val = yearStart ? Number(yearStart) : null
    if (val === (visit.year_start ?? null)) return
    const { error } = await supabase
      .from('visits').update({ year_start: val }).eq('id', visit.id)
    if (!error) replaceVisit({ ...visit, year_start: val ?? undefined })
  }

  async function handleMonthStartChange(val: number) {
    setMonthStart(val)
    const v = val || null
    const { error } = await supabase
      .from('visits').update({ month_start: v }).eq('id', visit.id)
    if (!error) replaceVisit({ ...visit, month_start: v ?? undefined })
  }

  async function handleYearEndBlur() {
    const val = yearEnd ? Number(yearEnd) : null
    if (val === (visit.year_end ?? null)) return
    const { error } = await supabase
      .from('visits').update({ year_end: val }).eq('id', visit.id)
    if (!error) replaceVisit({ ...visit, year_end: val ?? undefined })
  }

  async function handleMonthEndChange(val: number) {
    setMonthEnd(val)
    const v = val || null
    const { error } = await supabase
      .from('visits').update({ month_end: v }).eq('id', visit.id)
    if (!error) replaceVisit({ ...visit, month_end: v ?? undefined })
  }

  async function handleDelete() {
    const { error } = await supabase.from('visits').delete().eq('id', visit.id)
    if (!error) {
      onDestinationChange({
        ...destination,
        visits: destination.visits.filter((v) => v.id !== visit.id),
      })
    }
  }

  const isLived = visit.type === 'lived'
  const yearLabel = formatYearRange(visit)

  return (
    <div className="rounded-xl bg-stone-50 p-4">
      {/* Type + year display row */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {(['visited', 'lived'] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              className={`rounded-full px-3 py-0.5 text-xs font-semibold transition-colors ${
                visit.type === t
                  ? t === 'lived' ? 'bg-green-50 text-emerald-700' : 'bg-red-50 text-coral'
                  : 'bg-stone-100 text-stone-300 hover:text-stone-500'
              }`}
            >
              {t === 'visited' ? 'Visited' : 'Lived'}
            </button>
          ))}
        </div>
        {yearLabel && (
          <span className="text-xs text-stone-400">{yearLabel}</span>
        )}
      </div>

      {/* Date editors */}
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-0.5 block text-[10px] font-medium uppercase text-stone-400">
            {isLived ? 'From' : 'When'}
          </label>
          <div className="flex gap-1">
            <select
              value={monthStart}
              onChange={(e) => handleMonthStartChange(Number(e.target.value))}
              className="w-16 rounded-md border border-stone-200 bg-white px-1 py-1 text-xs text-stone-600 focus:border-stone-400 focus:outline-none"
            >
              {MONTHS_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <input
              type="number"
              value={yearStart}
              onChange={(e) => setYearStart(e.target.value)}
              onBlur={handleYearStartBlur}
              placeholder="Year"
              className="w-16 rounded-md border border-stone-200 px-2 py-1 text-xs text-stone-600 placeholder:text-stone-300 focus:border-stone-400 focus:outline-none"
            />
          </div>
        </div>
        {isLived && (
          <div>
            <label className="mb-0.5 block text-[10px] font-medium uppercase text-stone-400">To</label>
            <div className="flex gap-1">
              <select
                value={monthEnd}
                onChange={(e) => handleMonthEndChange(Number(e.target.value))}
                className="w-16 rounded-md border border-stone-200 bg-white px-1 py-1 text-xs text-stone-600 focus:border-stone-400 focus:outline-none"
              >
                {MONTHS_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <input
                type="number"
                value={yearEnd}
                onChange={(e) => setYearEnd(e.target.value)}
                onBlur={handleYearEndBlur}
                placeholder="Year"
                className="w-16 rounded-md border border-stone-200 px-2 py-1 text-xs text-stone-600 placeholder:text-stone-300 focus:border-stone-400 focus:outline-none"
              />
            </div>
          </div>
        )}
        <button
          onClick={handleDelete}
          className="ml-auto text-stone-300 hover:text-red-500"
          aria-label="Delete visit"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 3.5h9M5.5 3.5V2.5a1 1 0 011-1h1a1 1 0 011 1v1M9 6v4.5M5 6v4.5M3.5 3.5l.5 8a1 1 0 001 1h4a1 1 0 001-1l.5-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Notes */}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={handleNotesBlur}
        placeholder="Add notes about this visit…"
        rows={2}
        className="mt-3 w-full resize-none rounded-lg bg-white px-3 py-2 text-sm text-stone-600 placeholder:text-stone-300 focus:outline-none"
      />
    </div>
  )
}

function EditableIntentCard({
  intent,
  destination,
  onDestinationChange,
}: {
  intent: Intent
  destination: Destination
  onDestinationChange: (d: Destination) => void
}) {
  const [notes, setNotes] = useState(intent.notes)
  const [targetYear, setTargetYear] = useState(String(intent.target_year ?? ''))

  function updateIntent(updated: Intent) {
    onDestinationChange({ ...destination, intent: updated })
  }

  async function handleStateChange(newState: IntentState) {
    const { error } = await supabase
      .from('intents').update({ state: newState }).eq('id', intent.id)
    if (!error) updateIntent({ ...intent, state: newState })
  }

  async function handleNotesBlur() {
    if (notes === intent.notes) return
    const { error } = await supabase
      .from('intents').update({ notes }).eq('id', intent.id)
    if (!error) updateIntent({ ...intent, notes })
  }

  async function handleTargetYearBlur() {
    const val = targetYear ? Number(targetYear) : null
    if (val === (intent.target_year ?? null)) return
    const { error } = await supabase
      .from('intents').update({ target_year: val }).eq('id', intent.id)
    if (!error) updateIntent({ ...intent, target_year: val ?? undefined })
  }

  async function handleRemove() {
    const { error } = await supabase.from('intents').delete().eq('id', intent.id)
    if (!error) onDestinationChange({ ...destination, intent: undefined })
  }

  return (
    <div className="rounded-xl bg-purple-50/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {(['on my list', 'planning'] as const).map((s) => (
            <button
              key={s}
              onClick={() => handleStateChange(s)}
              className={`rounded-full px-3 py-0.5 text-xs font-semibold transition-colors ${
                intent.state === s
                  ? s === 'planning' ? 'bg-purple-100 text-purple-700' : 'bg-purple-50 text-purple-500'
                  : 'bg-stone-100 text-stone-300 hover:text-stone-500'
              }`}
            >
              {s === 'on my list' ? 'On my list' : 'Actively Planning'}
            </button>
          ))}
        </div>
        <button
          onClick={handleRemove}
          className="text-stone-300 hover:text-red-500"
          aria-label="Remove intent"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 3.5h9M5.5 3.5V2.5a1 1 0 011-1h1a1 1 0 011 1v1M9 6v4.5M5 6v4.5M3.5 3.5l.5 8a1 1 0 001 1h4a1 1 0 001-1l.5-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Target year */}
      <div className="mt-3 flex items-end gap-2">
        <div>
          <label className="mb-0.5 block text-[10px] font-medium uppercase text-stone-400">Target year</label>
          <input
            type="number"
            value={targetYear}
            onChange={(e) => setTargetYear(e.target.value)}
            onBlur={handleTargetYearBlur}
            placeholder="Year"
            className="w-20 rounded-md border border-stone-200 px-2 py-1 text-xs text-stone-600 placeholder:text-stone-300 focus:border-stone-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Notes */}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={handleNotesBlur}
        placeholder="Add notes about this plan…"
        rows={2}
        className="mt-3 w-full resize-none rounded-lg bg-white px-3 py-2 text-sm text-stone-600 placeholder:text-stone-300 focus:outline-none"
      />
    </div>
  )
}

export default function Sidebar({
  destination,
  onClose,
  onDestinationChange,
  onDeleteDestination,
  onAddVisit,
  onAddIntent,
}: SidebarProps) {
  const isOpen = !!destination

  async function handleDeleteDestination() {
    if (!destination) return
    if (!confirm(`Remove ${destination.name} from your map?`)) return

    const { error } = await supabase.from('destinations').delete().eq('id', destination.id)
    if (!error) {
      onDeleteDestination(destination.id)
    }
  }

  return (
    <>
      {/* Backdrop (mobile) */}
      <div
        className={`fixed inset-0 z-30 bg-black/20 transition-opacity md:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className={`
          fixed z-40 bg-white shadow-xl transition-transform duration-300 ease-in-out
          inset-x-0 bottom-0 max-h-[75vh] rounded-t-2xl
          md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-96 md:rounded-none
          ${isOpen
            ? 'translate-y-0 md:translate-x-0'
            : 'translate-y-full md:translate-x-full md:translate-y-0'
          }
        `}
      >
        {destination && (
          <div className="flex h-full flex-col overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-stone-100 px-6 pb-4 pt-6">
              <div>
                <h2 className="text-xl font-semibold text-stone-900">
                  {destination.name}
                </h2>
                {destination.country && (
                  <p className="mt-0.5 text-sm text-stone-400">
                    {destination.country}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="ml-4 mt-1 text-stone-300 hover:text-stone-500"
                aria-label="Close sidebar"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              {/* Visits */}
              {destination.visits.length > 0 && (
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
                    History
                  </h3>
                  <div className="space-y-3">
                    {destination.visits
                      .slice()
                      .sort((a, b) => (b.year_start ?? 0) - (a.year_start ?? 0))
                      .map((visit) => (
                        <EditableVisitCard
                          key={visit.id}
                          visit={visit}
                          destination={destination}
                          onDestinationChange={onDestinationChange}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Intent */}
              {destination.intent && (
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
                    Plans
                  </h3>
                  <EditableIntentCard
                    intent={destination.intent}
                    destination={destination}
                    onDestinationChange={onDestinationChange}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t border-stone-100 px-6 pb-6 pt-4">
              <button
                onClick={onAddVisit}
                className="w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white hover:bg-stone-800"
              >
                + Add Visit
              </button>

              {!destination.intent && (
                <button
                  onClick={onAddIntent}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 py-2 text-sm font-medium text-purple-600 hover:text-purple-700"
                >
                  <svg width="14" height="14" viewBox="0 0 28 28" fill="none">
                    <path
                      d="M14 2l3.5 7.5L25 10.5l-5.5 5L21 23l-7-4-7 4 1.5-7.5L3 10.5l7.5-1L14 2z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                  Add to Plans
                </button>
              )}

              <button
                onClick={handleDeleteDestination}
                className="mt-2 flex w-full items-center justify-center py-2 text-xs text-stone-300 hover:text-red-500"
              >
                Delete pin
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
