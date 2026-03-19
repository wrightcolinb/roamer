'use client'

import { useState, useCallback } from 'react'
import type { Destination } from '@/lib/types'
import type { MapHandle } from '@/components/Map'
import { getPinState } from '@/lib/mapUtils'
import type { PinState } from '@/lib/types'

interface ExportButtonProps {
  destinations: Destination[]
  mapRef: React.RefObject<MapHandle | null>
}

function computeStats(destinations: Destination[]) {
  const countries = new Set<string>()
  const continents = new Set<string>()
  let earliestYear: number | null = null

  for (const dest of destinations) {
    if (dest.country) countries.add(dest.country)
    if (dest.continent) continents.add(dest.continent)
    for (const visit of dest.visits) {
      if (visit.year_start != null) {
        if (earliestYear === null || visit.year_start < earliestYear) {
          earliestYear = visit.year_start
        }
      }
    }
  }

  return {
    countryCount: countries.size,
    continentCount: continents.size,
    earliestYear,
    currentYear: new Date().getFullYear(),
  }
}

function drawPin(ctx: CanvasRenderingContext2D, x: number, y: number, state: PinState, dpr: number) {
  ctx.save()
  ctx.translate(x, y)

  const s = dpr * 1.0
  ctx.scale(s, s)

  if (state === 'visited') {
    ctx.beginPath()
    ctx.arc(0, 0, 10, 0, Math.PI * 2)
    ctx.fillStyle = '#E8735A'
    ctx.fill()
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    ctx.stroke()
  } else if (state === 'lived') {
    ctx.fillStyle = '#2D6A4F'
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    const p = new Path2D('M0 -11.5c-.5 0-1 .2-1.3.6L-10.6-1.2c-.6.7-.1 1.7.8 1.7H-8v8c0 1.4 1.1 2.5 2.5 2.5h11c1.4 0 2.5-1.1 2.5-2.5v-8h1.8c.9 0 1.4-1 .8-1.7L1.3-10.9c-.3-.4-.8-.6-1.3-.6z')
    ctx.fill(p)
    ctx.stroke(p)
  } else if (state === 'planning') {
    ctx.fillStyle = '#7B2FF7'
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    const p = new Path2D('M0 -11.5c.4 0 .7.2.9.6l2.8 5.9 6.3.9c.8.1 1.1 1.1.5 1.7l-4.6 4.5 1.1 6.3c.1.8-.7 1.4-1.4 1l-5.6-3-5.6 3c-.7.4-1.5-.2-1.4-1l1.1-6.3-4.6-4.5c-.6-.6-.3-1.6.5-1.7l6.3-.9 2.8-5.9c.2-.4.5-.6.9-.6z')
    ctx.fill(p)
    ctx.stroke(p)
  } else {
    ctx.fillStyle = '#C4A8D8'
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    const p = new Path2D('M0 -11.5c.4 0 .7.2.9.6l2.8 5.9 6.3.9c.8.1 1.1 1.1.5 1.7l-4.6 4.5 1.1 6.3c.1.8-.7 1.4-1.4 1l-5.6-3-5.6 3c-.7.4-1.5-.2-1.4-1l1.1-6.3-4.6-4.5c-.6-.6-.3-1.6.5-1.7l6.3-.9 2.8-5.9c.2-.4.5-.6.9-.6z')
    ctx.fill(p)
    ctx.stroke(p)
  }

  ctx.restore()
}

function drawStatBlock(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  stats: ReturnType<typeof computeStats>,
  dpr: number
) {
  const blockHeight = 80 * dpr
  const y = height - blockHeight

  ctx.fillStyle = 'rgba(250, 247, 242, 0.92)'
  ctx.fillRect(0, y, width, blockHeight)

  ctx.strokeStyle = 'rgba(180, 170, 155, 0.3)'
  ctx.lineWidth = dpr
  ctx.beginPath()
  ctx.moveTo(0, y)
  ctx.lineTo(width, y)
  ctx.stroke()

  const centerX = width / 2
  const textY = y + blockHeight / 2

  const parts: string[] = []
  if (stats.countryCount > 0) {
    parts.push(`${stats.countryCount} ${stats.countryCount === 1 ? 'country' : 'countries'}`)
  }
  if (stats.continentCount > 0) {
    parts.push(`${stats.continentCount} ${stats.continentCount === 1 ? 'continent' : 'continents'}`)
  }
  if (stats.earliestYear) {
    const years = stats.currentYear - stats.earliestYear
    if (years > 0) {
      parts.push(`${years} ${years === 1 ? 'year' : 'years'} traveling`)
    }
  }

  const statLine = parts.join('  ·  ')

  ctx.fillStyle = '#44403C'
  ctx.font = `600 ${18 * dpr}px system-ui, -apple-system, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('My Travel Map', centerX, textY - 14 * dpr)

  ctx.fillStyle = '#78716C'
  ctx.font = `400 ${13 * dpr}px system-ui, -apple-system, sans-serif`
  ctx.fillText(statLine, centerX, textY + 12 * dpr)

  ctx.fillStyle = 'rgba(168, 162, 158, 0.5)'
  ctx.font = `400 ${10 * dpr}px system-ui, -apple-system, sans-serif`
  ctx.textAlign = 'right'
  ctx.fillText('roamer', width - 16 * dpr, y + blockHeight - 10 * dpr)
}

function ExportPreviewModal({
  imageUrl,
  onSave,
  onClose,
}: {
  imageUrl: string
  onSave: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-stone-100 px-6 pb-3 pt-5">
          <h2 className="text-lg font-semibold text-stone-900">Export Preview</h2>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <img
            src={imageUrl}
            alt="Map export preview"
            className="w-full rounded-lg shadow-sm"
          />
        </div>

        <div className="flex gap-3 border-t border-stone-100 px-6 pb-5 pt-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-stone-200 py-2.5 text-sm font-medium text-stone-500 hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="flex-1 rounded-xl bg-stone-900 py-2.5 text-sm font-semibold text-white hover:bg-stone-800"
          >
            Save Image
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ExportButton({ destinations, mapRef }: ExportButtonProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [blobRef, setBlobRef] = useState<Blob | null>(null)

  const generateExport = useCallback(async () => {
    const map = mapRef.current?.getMap()
    if (!map) return

    // Wait for map to finish rendering
    await new Promise<void>((resolve) => {
      if (map.isStyleLoaded() && !map.isMoving()) {
        resolve()
      } else {
        map.once('idle', () => resolve())
      }
    })

    const mapCanvas = map.getCanvas()
    const width = mapCanvas.width
    const height = mapCanvas.height

    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = width
    exportCanvas.height = height

    const ctx = exportCanvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1

    // Draw map base
    ctx.drawImage(mapCanvas, 0, 0)

    // Draw pins at projected positions
    for (const dest of destinations) {
      const point = map.project([dest.lng, dest.lat])
      const px = point.x * dpr
      const py = point.y * dpr
      const state = getPinState(dest)
      drawPin(ctx, px, py, state, dpr)
    }

    // Draw stat block
    const stats = computeStats(destinations)
    drawStatBlock(ctx, width, height, stats, dpr)

    // Generate preview
    exportCanvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
      setBlobRef(blob)
    }, 'image/png')
  }, [destinations, mapRef])

  function handleSave() {
    if (!blobRef) return
    const url = URL.createObjectURL(blobRef)
    const a = document.createElement('a')
    a.href = url
    a.download = `roamer-map-${new Date().toISOString().slice(0, 10)}.png`
    a.click()
    URL.revokeObjectURL(url)
    handleClose()
  }

  function handleClose() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setBlobRef(null)
  }

  return (
    <>
      <button
        onClick={generateExport}
        className="fixed right-4 top-4 z-10 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-600 shadow-sm hover:bg-stone-50"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 10v3a1 1 0 001 1h10a1 1 0 001-1v-3M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Export
      </button>

      {previewUrl && (
        <ExportPreviewModal
          imageUrl={previewUrl}
          onSave={handleSave}
          onClose={handleClose}
        />
      )}
    </>
  )
}
