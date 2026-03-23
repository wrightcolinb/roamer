'use client'

interface MapHelpButtonProps {
  onClick: () => void
}

export default function MapHelpButton({ onClick }: MapHelpButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        fixed z-30
        bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-6
        w-10 h-10 rounded-full shadow-lg
        bg-white/90 backdrop-blur-sm border border-gray-200
        text-gray-600 text-lg font-semibold leading-none
        flex items-center justify-center
        hover:bg-white hover:shadow-xl transition-all
      "
      aria-label="Open map tips"
    >
      ?
    </button>
  )
}
