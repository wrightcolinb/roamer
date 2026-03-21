import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const match = request.nextUrl.pathname.match(/^\/u\/([^/]+)/)
  if (match) {
    const response = NextResponse.next()
    response.headers.set('x-user-slug', match[1])
    return response
  }
  return NextResponse.next()
}

export const config = {
  matcher: '/u/:slug*',
}
