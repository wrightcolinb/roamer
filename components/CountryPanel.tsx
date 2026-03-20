'use client'

import { Country, Destination, CountryStatus } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { getContinentFromCode } from '@/lib/countryUtils'
import { getPinState } from '@/lib/mapUtils'

interface CountryPanelProps {
  countryCode: string | null
  countryName: string
  countries: Country[]
  destinations: Destination[]
  onClose: () => void
  onCountryUpdate: (country: Country) => void
  onCountryRemove: (countryId: string) => void
  onDestinationClick: (dest: Destination) => void
}

const STATUS_OPTIONS: { value: CountryStatus | 'remove'; label: string; color: string }[] = [
  { value: 'visited', label: 'Visited', color: '#E8735A' },
  { value: 'lived', label: 'Lived', color: '#2D6A4F' },
  { value: 'remove', label: 'Remove', color: '#9CA3AF' },
]

export default function CountryPanel({
  countryCode,
  countryName,
  countries,
  destinations,
  onClose,
  onCountryUpdate,
  onCountryRemove,
  onDestinationClick,
}: CountryPanelProps) {
  if (!countryCode) return null
  const code = countryCode

  const country = countries.find((c) => c.country_code === code)
  const countryDests = destinations.filter((d) => d.country_code === code)
  const displayName = country?.country_name ?? countryName ?? code

  async function handleStatusChange(status: CountryStatus | 'remove') {
    if (status === 'remove') {
      if (country) {
        await supabase.from('countries').delete().eq('id', country.id)
        onCountryRemove(country.id)
      }
      return
    }

    if (country) {
      const { data } = await supabase
        .from('countries')
        .update({ status })
        .eq('id', country.id)
        .select()
        .single()
      if (data) onCountryUpdate(data)
    } else {
      const continent = getContinentFromCode(code)
      const { data } = await supabase
        .from('countries')
        .insert({
          country_code: code,
          country_name: countryName || code,
          continent,
          status,
        })
        .select()
        .single()
      if (data) onCountryUpdate(data)
    }
  }

  function isActive(optValue: CountryStatus | 'remove') {
    if (!country) return optValue === 'remove'
    return optValue === country.status
  }

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />

      <aside className="fixed z-40 bg-white shadow-2xl overflow-y-auto bottom-0 left-0 right-0 h-[70vh] rounded-t-2xl animate-slide-up md:top-0 md:right-0 md:left-auto md:bottom-auto md:h-full md:w-full md:max-w-md md:rounded-t-none md:rounded-l-2xl md:animate-slide-right">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 text-xl"
        >
          ×
        </button>

        <div className="p-6 pt-8">
          <h2 className="text-xl font-semibold text-gray-800 pr-8">{displayName}</h2>

          {/* Status toggle */}
          <div className="flex gap-2 mt-5">
            {STATUS_OPTIONS.map((opt) => {
              const active = isActive(opt.value)
              return (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  className="flex-1 py-2 rounded-lg border-2 text-xs font-medium transition-colors"
                  style={{
                    borderColor: opt.color,
                    backgroundColor: active ? opt.color : 'white',
                    color: active ? 'white' : opt.color,
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>

          <hr className="my-6 border-gray-100" />

          {/* Destinations in this country */}
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Destinations</h3>
          {countryDests.length === 0 ? (
            <p className="text-sm text-gray-400">No destinations added yet</p>
          ) : (
            <div className="space-y-2">
              {countryDests.map((d) => (
                <button
                  key={d.id}
                  onClick={() => onDestinationClick(d)}
                  className="w-full text-left px-3 py-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-700">{d.name}</p>
                  <p className="text-xs text-gray-400 capitalize">
                    {getPinState(d).replace('_', ' ')}
                    {d.visits[0]?.year_start ? ` · ${d.visits[0].year_start}` : ''}
                  </p>
                </button>
              ))}
            </div>
          )}

          <hr className="my-6 border-gray-100" />

          {/* Friends placeholder */}
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Friends who&apos;ve been here
          </h3>
          <div className="py-8 text-center">
            <p className="text-sm text-gray-400">Coming soon</p>
          </div>
        </div>
      </aside>
    </>
  )
}
