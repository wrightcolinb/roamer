import '@/styles/globals.css'
import Script from 'next/script'
import type { Viewport } from 'next'

export const metadata = {
  title: 'Roamer',
  description: 'Your personal travel map',
}

export const viewport: Viewport = {
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="m-0 p-0 overflow-hidden">
        {children}
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}&libraries=places&v=weekly&loading=async`}
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
