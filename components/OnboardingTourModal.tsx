'use client'

import { useEffect, useState } from 'react'

const SLIDES = [
  {
    title: '🌍 Fill in your world',
    body: 'Click any country to mark it as visited or lived in. Start broad, then go specific.',
  },
  {
    title: '📍 Log your places',
    body: "Pin the cities, neighbourhoods and spots you've lived in or visited. Each one keeps its own story.",
  },
  {
    title: '💬 Share what you know',
    body: "Leave honest notes on what's worth it, what's meh, and what to skip. Your friends will see them when they're planning a trip somewhere you've been.",
  },
  {
    title: '✨ Now make it yours',
    body: 'Tap the ? any time if you want this back. The map gets better the more you put in.',
  },
] as const

interface OnboardingTourModalProps {
  open: boolean
  onClose: () => void
}

export default function OnboardingTourModal({ open, onClose }: OnboardingTourModalProps) {
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    if (open) setSlide(0)
  }, [open])

  if (!open) return null

  const isLast = slide === SLIDES.length - 1

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-tour-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>

        <p className="text-xs font-medium text-[#E8735A] mb-2">
          {slide + 1} / {SLIDES.length}
        </p>
        <h2 id="onboarding-tour-title" className="text-lg font-semibold text-gray-800 pr-8">
          {SLIDES[slide].title}
        </h2>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          {SLIDES[slide].body}
        </p>

        <div className="flex gap-3 mt-8">
          {slide > 0 ? (
            <button
              type="button"
              onClick={() => setSlide((s) => s - 1)}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          ) : (
            <span className="flex-1" />
          )}
          <button
            type="button"
            onClick={() => (isLast ? onClose() : setSlide((s) => s + 1))}
            className="flex-1 py-2.5 rounded-lg bg-[#E8735A] text-white text-sm font-medium hover:bg-[#d4654e] transition-colors"
          >
            {isLast ? 'Got it' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
