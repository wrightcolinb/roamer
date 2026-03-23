'use client'

import { useState, useEffect, useMemo } from 'react'
import { CountryFill, Destination, CountryStatus } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import {
  buildFriendLocationGroups,
  mapFriendCountryActivityRow,
  resolveViewerDestinationForFriendGroup,
  type FriendCountryActivityRow,
} from '@/lib/friendCountryGroups'
import { getContinentFromCode } from '@/lib/countryUtils'
import { formatPinStateLabel, getCountryPanelDestinationLines } from '@/lib/mapUtils'
import { useUser } from '@/lib/UserContext'
import FriendCountryLocationGroup from '@/components/FriendCountryLocationGroup'
import type { FriendLocationSidebarPreview } from '@/lib/friendCountryGroups'

interface CountryPanelProps {
  countryCode: string | null
  countryName: string
  countries: CountryFill[]
  destinations: Destination[]
  onClose: () => void
  onCountryUpdate: (country: CountryFill) => void
  onCountryRemove: (countryId: string) => void
  onDestinationClick: (dest: Destination) => void
  onFriendLocationPreview: (preview: FriendLocationSidebarPreview) => void
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
  onFriendLocationPreview,
}: CountryPanelProps) {
  const { user } = useUser()
  const [friendActivityLoading, setFriendActivityLoading] = useState(false)
  const [friendActivityRows, setFriendActivityRows] = useState<FriendCountryActivityRow[]>([])

  useEffect(() => {
    if (!countryCode || !user) return
    let cancelled = false

    async function loadFriendActivity() {
      setFriendActivityLoading(true)
      try {
        const { data } = await supabase.rpc('get_friend_country_activity', {
          p_user_id: user!.id,
          p_country_code: countryCode,
        })

        if (cancelled) return

        if (!data?.length) {
          setFriendActivityRows([])
          return
        }

        setFriendActivityRows(data.map(mapFriendCountryActivityRow))
      } finally {
        if (!cancelled) setFriendActivityLoading(false)
      }
    }

    setFriendActivityRows([])
    loadFriendActivity()
    return () => { cancelled = true }
  }, [countryCode, user])

  // Must run before any early return — same hook order when countryCode is null vs set.
  const friendLocationGroups = useMemo(
    () => buildFriendLocationGroups(friendActivityRows),
    [friendActivityRows]
  )

  if (!countryCode) return null
  const code = countryCode

  const country = countries.find((c) => c.country_code === code)
  const countryDests = destinations.filter((d) => d.country_code === code)
  const displayName = country?.country_name ?? countryName ?? code

  async function handleStatusChange(status: CountryStatus | 'remove') {
    if (status === 'remove') {
      if (country) {
        await supabase.from('country_fills').delete().eq('id', country.id)
        onCountryRemove(country.id)
      }
      return
    }

    if (country) {
      const { data } = await supabase
        .from('country_fills')
        .update({ status })
        .eq('id', country.id)
        .select()
        .single()
      if (data) onCountryUpdate(data)
    } else {
      const continent = getContinentFromCode(code)
      const { data } = await supabase
        .from('country_fills')
        .insert({
          user_id: user?.id,
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

      <aside className="fixed z-40 bg-white shadow-2xl overflow-y-auto bottom-0 left-0 right-0 h-[70dvh] rounded-t-2xl animate-slide-up md:top-0 md:right-0 md:left-auto md:bottom-auto md:h-full md:w-full md:max-w-md md:rounded-t-none md:rounded-l-2xl md:animate-slide-right">
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
              {countryDests.map((d) => {
                const { livedLine, visitedLine, nextUpLine } = getCountryPanelDestinationLines(d)
                const lines = [livedLine, visitedLine, nextUpLine].filter(Boolean) as string[]
                if (lines.length === 0) lines.push(formatPinStateLabel(d))
                return (
                  <button
                    key={d.id}
                    onClick={() => onDestinationClick(d)}
                    className="w-full text-left px-3 py-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-700">{d.name}</p>
                    <div className="text-xs text-gray-400 space-y-0.5">
                      {lines.map((line, i) => (
                        <p key={`${d.id}-sub-${i}`}>{line}</p>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          <hr className="my-6 border-gray-100" />

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Friends who&apos;ve been here
            </p>
            {friendActivityLoading ? (
              <p className="text-sm text-gray-400">Loading&hellip;</p>
            ) : friendLocationGroups.length === 0 ? (
              <p className="text-sm text-gray-400">
                No friends in your network have shared trips here yet.
              </p>
            ) : (
              <div className="space-y-4">
                {friendLocationGroups.map((group) => (
                  <FriendCountryLocationGroup
                    key={group.key}
                    group={group}
                    matchedDestination={resolveViewerDestinationForFriendGroup(group, countryDests)}
                    onOpenDestination={onDestinationClick}
                    onOpenFriendPreview={onFriendLocationPreview}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
