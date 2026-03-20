'use client'

import { Country, Destination } from '@/lib/types'

interface StatBlockProps {
  countries: Country[]
  destinations: Destination[]
}

export default function StatBlock({ countries, destinations }: StatBlockProps) {
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
    <div className="hidden md:block absolute bottom-6 left-6 z-10">
      <div
        style={{
          background: 'rgba(255, 252, 242, 0.82)',
          border: '0.5px solid rgba(255, 255, 255, 0.6)',
          borderRadius: '10px',
          padding: '14px 16px',
          minWidth: '200px',
        }}
      >
        {/* Brand mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
          <img src="/logo.png" alt="Roamer" style={{ height: '14px', width: 'auto' }} />
          <span style={{ fontSize: '11px', fontWeight: 500, color: '#888780', letterSpacing: '0.04em' }}>
            Roamer
          </span>
        </div>

        {/* Colin's travels */}
        <div
          onClick={() => {}}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            marginBottom: 0,
          }}
        >
          <span style={{ fontSize: '16px', fontWeight: 500, color: '#2c2c2a' }}>
            Colin&apos;s travels
          </span>
          <span style={{ fontSize: '13px', color: '#b4b2a9' }}>›</span>
        </div>

        {/* Divider */}
        <div style={{ height: '0.5px', background: 'rgba(0, 0, 0, 0.08)', margin: '10px 0' }} />

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '36px', fontWeight: 500, lineHeight: 1.1, color: '#D85A30' }}>
              {totalCountries}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(0, 0, 0, 0.45)', lineHeight: 1.3 }}>
              countries
            </div>
          </div>
          <div>
            <div style={{ fontSize: '36px', fontWeight: 500, lineHeight: 1.1, color: '#2D6A4F' }}>
              {countriesLived}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(0, 0, 0, 0.45)', lineHeight: 1.3 }}>
              lived
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '0.5px', background: 'rgba(0, 0, 0, 0.08)', margin: '10px 0' }} />

        {/* Next up section */}
        <div
          style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            fontWeight: 500,
            color: '#888780',
            letterSpacing: '0.05em',
            marginBottom: '6px',
          }}
        >
          Next up
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
                  backgroundColor: '#7F77DD',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: '12px', color: '#2c2c2a', lineHeight: 1.4 }}>
                {dest.name}
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
  )
}
