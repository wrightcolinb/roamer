'use client'

interface OnboardingCalloutProps {
  visible: boolean
}

export default function OnboardingCallout({ visible }: OnboardingCalloutProps) {
  if (!visible) return null

  return (
    <div
      className="
        fixed z-20 animate-fade-in
        bottom-[calc(2rem+env(safe-area-inset-bottom))] md:bottom-8
        right-[calc(1.5rem+11.5rem)] md:right-[calc(1.5rem+12rem)]
        flex items-center
      "
    >
      <div className="relative bg-white rounded-xl shadow-lg px-3 py-2 border border-gray-100 max-w-[220px]">
        <p className="text-xs text-gray-700 leading-snug">
          When in Country Fill mode, click countries once for visited <span className="font-semibold text-[#E8735A]">(coral)</span>, twice for lived <span className="font-semibold text-[#2D6A4F]">(green)</span>. Hit <kbd className="font-mono bg-gray-100 px-1 rounded text-[10px]">esc</kbd> or click the button when done.
        </p>

        {/* Arrow pointing right toward the ModeToggle button */}
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-t border-r border-gray-100 rotate-45" />
      </div>
    </div>
  )
}
