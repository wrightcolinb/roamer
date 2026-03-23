'use client'

import { CountryFill, Destination } from '@/lib/types'

interface StatBlockProps {
  countries: CountryFill[]
  destinations: Destination[]
  displayName: string
}

function nextUpDestinationDisplayName({ name, country_name }: Destination): string {
  const country = country_name?.trim()
  if (!country) return name
  if (name === country_name) return name
  return `${name}, ${country}`
}

export default function StatBlock({ countries, destinations, displayName }: StatBlockProps) {
  const totalCountries = countries.length
  const countriesLived = countries.filter((c) => c.status === 'lived').length

  const nextUpDestinations = destinations
    .filter((d) => d.next_up)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(0, 5)

  const TOTAL_SLOTS = 5
  const emptySlots = nextUpDestinations.length >= TOTAL_SLOTS
    ? 0
    : TOTAL_SLOTS - nextUpDestinations.length

  return (
    <div className="absolute bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-3 z-10 md:bottom-8 md:left-6">
      <div
        style={{
          background: 'rgba(255, 252, 242, 0.82)',
          border: '0.5px solid rgba(255, 255, 255, 0.6)',
          borderRadius: '10px',
        }}
        className="p-2.5 md:py-[14px] md:px-4 md:min-w-[200px]"
      >
        {/* Brand mark */}
        <div className="flex items-center mb-2 md:mb-[10px]">
          <img src="/logo.png" alt="Roamer" className="h-8 w-auto md:h-10" />
        </div>

        {/* Colin's travels */}
        <div
          onClick={() => {}}
          className="flex justify-between items-center gap-2 min-h-[36px] cursor-pointer"
        >
          <span className="text-sm font-medium md:text-base" style={{ color: '#2c2c2a' }}>
            {displayName}&apos;s travels
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b4b2a9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>

        {/* Divider */}
        <div className="my-2 md:my-2.5" style={{ height: '0.5px', background: 'rgba(0, 0, 0, 0.08)' }} />

        {/* Stats row */}
        <div className="flex gap-3 md:gap-5">
          <div>
            <div className="text-2xl font-medium leading-none md:text-[36px]" style={{ color: '#E8735A' }}>
              {totalCountries}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: 'rgba(0, 0, 0, 0.45)', lineHeight: 1.3 }}>
              countries
            </div>
          </div>
          <div>
            <div className="text-2xl font-medium leading-none md:text-[36px]" style={{ color: '#2D6A4F' }}>
              {countriesLived}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: 'rgba(0, 0, 0, 0.45)', lineHeight: 1.3 }}>
              lived
            </div>
          </div>
        </div>

        {/* Next up count — mobile only */}
        <div className="mt-2 md:hidden">
          <span className="text-[11px]" style={{ color: '#7C3AED' }}>
            {nextUpDestinations.length} of 5 next up
          </span>
        </div>

        {/* Divider — desktop only */}
        <div className="hidden md:block my-2.5" style={{ height: '0.5px', background: 'rgba(0, 0, 0, 0.08)' }} />

        {/* Next up section — desktop only */}
        <div className="hidden md:block">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                fontWeight: 500,
                color: '#888780',
                letterSpacing: '0.05em',
              }}
            >
              Next up
            </span>
            <span style={{ fontSize: '10px', color: '#b4b2a9' }}>
              {nextUpDestinations.length}/5
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {nextUpDestinations.map((dest) => (
              <div
                key={dest.id}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#7C3AED',
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: '12px', color: '#2c2c2a', lineHeight: 1.4 }}>
                  {nextUpDestinationDisplayName(dest)}
                </span>
              </div>
            ))}

            {Array.from({ length: emptySlots }).map((_, i) => (
              <div
                key={`empty-${i}`}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    border: '1px dashed #b4b2a9',
                    flexShrink: 0,
                    boxSizing: 'border-box',
                  }}
                />
                <span style={{ fontSize: '12px', color: '#b4b2a9' }}>—</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
