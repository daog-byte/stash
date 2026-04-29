import { getSignInUrl } from '@workos-inc/authkit-nextjs'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const redirectUri = process.env.WORKOS_REDIRECT_URI ?? process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI

  if (!process.env.WORKOS_CLIENT_ID || !process.env.WORKOS_API_KEY || !process.env.WORKOS_COOKIE_PASSWORD || !redirectUri) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const returnTo = request.nextUrl.searchParams.get('returnTo') || '/home'
  const authorizationUrl = await getSignInUrl({
    redirectUri,
    returnTo,
  })

  return NextResponse.redirect(authorizationUrl)
}