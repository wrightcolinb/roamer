'use client'

interface OnboardingCalloutProps {
  visible: boolean
}

export default function OnboardingCallout({ visible }: OnboardingCalloutProps) {
  if (!visible) return null

  return (
    <div className="fixed z-20 animate-fade-in bottom-[calc(5.75rem+env(safe-area-inset-bottom))] md:bottom-[5.75rem] right-20 max-w-[min(220px,calc(100vw-6rem))]">
      <div className="relative bg-white rounded-xl shadow-xl p-4 border border-gray-100">
        <p className="text-sm text-gray-700 leading-snug">
          When in Country Fill mode, click countries once for visited <span className="font-semibold text-[#E8735A]">(coral)</span>, twice for lived <span className="font-semibold text-[#2D6A4F]">(green)</span>.<span className="hidden md:inline"> Hit <kbd className="font-mono bg-gray-100 px-1 rounded text-[10px]">esc</kbd> or click</span><span className="md:hidden"> Click</span> the button when done.
        </p>

        {/* Arrow pointing down toward the ModeToggle button */}
        <div className="absolute -bottom-2 right-3 w-4 h-4 bg-white border-b border-r border-gray-100 rotate-45" />
      </div>
    </div>
  )
}
