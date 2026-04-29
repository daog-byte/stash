import { authkitProxy } from '@workos-inc/authkit-nextjs'
import { NextRequest, NextResponse } from 'next/server'

const redirectUri = process.env.WORKOS_REDIRECT_URI ?? process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI

const isAuthConfigured = Boolean(
  process.env.WORKOS_CLIENT_ID &&
    process.env.WORKOS_API_KEY &&
    process.env.WORKOS_COOKIE_PASSWORD &&
    redirectUri,
)

const authProxy = isAuthConfigured
  ? authkitProxy({
      redirectUri,
      middlewareAuth: {
        enabled: true,
        unauthenticatedPaths: ['/login', '/api/auth/callback'],
      },
    })
  : null

export default function proxy(request: NextRequest) {
  if (!authProxy) {
    return NextResponse.next()
  }

  return authProxy(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
}