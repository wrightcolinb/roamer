'use client'

interface OnboardingCalloutProps {
  visible: boolean
}

export default function OnboardingCallout({ visible }: OnboardingCalloutProps) {
  if (!visible) return null

  return (
    <div className="fixed bottom-20 right-6 z-20 max-w-xs animate-fade-in">
      <div className="relative bg-white rounded-xl shadow-xl p-4 border border-gray-100">
        <p className="text-sm text-gray-800 font-medium leading-snug">
          Click countries you&apos;ve visited or lived in to fill your map
        </p>
        <p className="mt-2 text-xs text-gray-400 flex items-center gap-1">
          <span className="inline-block translate-y-px">&#8595;</span>
          Toggle off when you&apos;re done
        </p>

        {/* Arrow pointing down toward the ModeToggle button */}
        <div
          className="absolute -bottom-2 right-10 w-4 h-4 bg-white border-b border-r border-gray-100 rotate-45"
        />
      </div>
    </div>
  )
}
