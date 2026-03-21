'use client'

import { useState } from 'react'
import { VisitType } from '@/lib/types'
import { monthName } from '@/lib/formatUtils'

type ModalType = VisitType | 'next_up'

const CURRENT_YEAR = new Date().getFullYear()
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

interface AddDestinationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (
    type: ModalType,
    yearStart?: number,
    yearEnd?: number,
    monthStart?: number,
    notes?: string,
  ) => void
  placeName: string
  nextUpCount: number
}

const TYPE_OPTIONS: { value: ModalType; label: string; color: string; activeColor: string }[] = [
  { value: 'visited', label: 'Visited', color: 'border-[#E8735A] text-[#E8735A]', activeColor: 'bg-[#E8735A] text-white border-[#E8735A]' },
  { value: 'lived', label: 'Lived', color: 'border-[#2D6A4F] text-[#2D6A4F]', activeColor: 'bg-[#2D6A4F] text-white border-[#2D6A4F]' },
  { value: 'next_up', label: 'Next Up', color: 'border-[#7C3AED] text-[#7C3AED]', activeColor: 'bg-[#7C3AED] text-white border-[#7C3AED]' },
]

export default function AddDestinationModal({ isOpen, onClose, onSave, placeName, nextUpCount }: AddDestinationModalProps) {
  const [selectedType, setSelectedType] = useState<ModalType | null>(null)
  const [monthStart, setMonthStart] = useState<number | undefined>(undefined)
  const [yearStart, setYearStart] = useState(String(CURRENT_YEAR))
  const [yearEnd, setYearEnd] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  function handleTypeSelect(type: ModalType) {
    setSelectedType(type)
    setError('')
  }

  function handleSave() {
    if (!selectedType) {
      setError('Select a type')
      return
    }

    if (selectedType === 'next_up' && nextUpCount >= 5) {
      return
    }

    if ((selectedType === 'visited' || selectedType === 'lived') && !yearStart.trim()) {
      setError('Year is required')
      return
    }

    const parsedStart = yearStart ? parseInt(yearStart, 10) : undefined
    const parsedEnd = yearEnd ? parseInt(yearEnd, 10) : undefined

    if (parsedStart && (parsedStart < 1900 || parsedStart > 2100)) {
      setError('Enter a valid year')
      return
    }

    const passMonthStart =
      (selectedType === 'visited' || selectedType === 'lived') ? monthStart : undefined
    const passNotes =
      (selectedType === 'visited' || selectedType === 'lived') ? notes : undefined

    onSave(selectedType, parsedStart, parsedEnd, passMonthStart, passNotes)

    resetState()
  }

  function handleClose() {
    resetState()
    onClose()
  }

  function resetState() {
    setSelectedType(null)
    setMonthStart(undefined)
    setYearStart(String(CURRENT_YEAR))
    setYearEnd('')
    setNotes('')
    setError('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-800">
          Add {placeName}
        </h2>

        {/* Type selection */}
        <div className="flex gap-2 mt-4 items-start">
          {TYPE_OPTIONS.map((opt) => {
            const isNextUpFull = opt.value === 'next_up' && nextUpCount >= 5
            return (
              <div key={opt.value} className="flex-1 flex flex-col items-stretch">
                <button
                  onClick={() => !isNextUpFull && handleTypeSelect(opt.value)}
                  disabled={isNextUpFull}
                  className={`w-full py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                    isNextUpFull
                      ? 'border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed'
                      : selectedType === opt.value ? opt.activeColor : opt.color
                  }`}
                >
                  {opt.label}
                </button>
                {isNextUpFull && (
                  <p className="mt-1 text-xs text-gray-400 text-center">5 of 5 used</p>
                )}
                {opt.value === 'next_up' && !isNextUpFull && selectedType === 'next_up' && (
                  <p className="mt-1 text-xs text-gray-400 text-center">{nextUpCount}/5 slots used</p>
                )}
              </div>
            )
          })}
        </div>

        {/* Month + Year inputs — conditional on visited / lived */}
        {(selectedType === 'visited' || selectedType === 'lived') && (
          <>
            <div className="mt-4 flex gap-3">
              <div className="w-32">
                <label className="block text-xs text-gray-500 mb-1">Month (optional)</label>
                <select
                  value={monthStart ?? ''}
                  onChange={(e) => setMonthStart(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 bg-white"
                >
                  <option value="">—</option>
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>{monthName(m)}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">
                  {selectedType === 'lived' ? 'From year' : 'Year'}
                </label>
                <input
                  type="number"
                  value={yearStart}
                  onChange={(e) => setYearStart(e.target.value)}
                  min="1900"
                  max="2100"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
                />
              </div>
              {selectedType === 'lived' && (
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">To year (optional)</label>
                  <input
                    type="number"
                    value={yearEnd}
                    onChange={(e) => setYearEnd(e.target.value)}
                    placeholder="Present"
                    min="1900"
                    max="2100"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="mt-3">
              <label className="block text-xs text-gray-500 mb-1">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="What was it like?"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 resize-none"
              />
            </div>
          </>
        )}

        {selectedType === 'next_up' && (
          <div className="mt-4">
            <label className="block text-xs text-gray-500 mb-1">Target year (optional)</label>
            <input
              type="number"
              value={yearStart}
              onChange={(e) => setYearStart(e.target.value)}
              min="1900"
              max="2100"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400"
            />
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="mt-3 text-sm text-red-500">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-lg bg-gray-800 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
