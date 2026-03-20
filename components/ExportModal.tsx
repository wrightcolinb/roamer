'use client'

import { useEffect, useRef, useState, RefObject } from 'react'
import html2canvas from 'html2canvas'
import { MapHandle } from '@/components/Map'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  mapRef: RefObject<MapHandle | null>
  mapContainerRef: RefObject<HTMLDivElement | null>
}

export default function ExportModal({ isOpen, onClose, mapRef, mapContainerRef }: ExportModalProps) {
  const [loading, setLoading] = useState(true)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const capturedCanvas = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setPreviewUrl(null)
      setLoading(true)
      capturedCanvas.current = null
      return
    }

    const map = mapRef.current?.getMap()
    const container = mapContainerRef.current
    if (!map || !container) return

    let cancelled = false

    async function capture() {
      if (!map || !container) return
      setLoading(true)
      setPreviewUrl(null)
      capturedCanvas.current = null

      // Save current view
      const prevCenter = map.getCenter()
      const prevZoom = map.getZoom()
      const prevBearing = map.getBearing()
      const prevPitch = map.getPitch()

      // Save and override container dimensions to 1400×700
      const prevWidth = container.style.width
      const prevHeight = container.style.height
      const prevBottom = container.style.bottom
      const prevRight = container.style.right

      container.style.width = '1600px'
      container.style.height = '1200px'
      container.style.bottom = 'auto'
      container.style.right = 'auto'
      map.resize()

      // Fly to export view
      map.flyTo({ center: [15, 15], zoom: 1.5, bearing: 0, pitch: 0 })

      // Wait for the map to settle
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, 6000)
        map.once('idle', () => {
          clearTimeout(timeout)
          resolve()
        })
      })

      if (cancelled) {
        container.style.width = prevWidth
        container.style.height = prevHeight
        container.style.bottom = prevBottom
        container.style.right = prevRight
        map.resize()
        return
      }

      // html2canvas capture
      const canvas = await html2canvas(container, {
        useCORS: true,
        allowTaint: false,
        scale: 2,
      })

      // Restore container dimensions and view
      container.style.width = prevWidth
      container.style.height = prevHeight
      container.style.bottom = prevBottom
      container.style.right = prevRight
      map.resize()
      map.flyTo({ center: prevCenter, zoom: prevZoom, bearing: prevBearing, pitch: prevPitch })

      if (cancelled) return

      capturedCanvas.current = canvas
      setPreviewUrl(canvas.toDataURL('image/png'))
      setLoading(false)
    }

    capture()

    return () => {
      cancelled = true
    }
  }, [isOpen])

  function handleDownload() {
    const canvas = capturedCanvas.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'roamer-map.png'
      link.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          borderRadius: 12,
          padding: 24,
          maxWidth: 700,
          width: '92%',
          background: '#fff',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span style={{ fontSize: 16, fontWeight: 500 }}>Export your map</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Preview area — fixed 2:1 aspect ratio */}
        <div style={{ position: 'relative', width: '100%', paddingBottom: '75%', borderRadius: 8, overflow: 'hidden', background: '#f3f4f6' }}>
          {loading ? (
            <div
              style={{ position: 'absolute', inset: 0 }}
              className="flex flex-col items-center justify-center gap-3 text-gray-400"
            >
              <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span className="text-sm">Preparing your map…</span>
            </div>
          ) : previewUrl ? (
            <img
              src={previewUrl}
              alt="Map preview"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, display: 'block' }}
            />
          ) : null}
        </div>

        {/* Download button */}
        <button
          onClick={handleDownload}
          disabled={loading || !previewUrl}
          className="mt-4 w-full py-2.5 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: '#E8735A' }}
        >
          Download
        </button>
      </div>
    </div>
  )
}
