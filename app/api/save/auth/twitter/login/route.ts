import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const appUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
  const clientId = process.env.X_CLIENT_ID
  const callbackUrl = new URL('/api/auth/twitter/callback', appUrl).toString()

  if (!clientId) {
    return NextResponse.redirect(`${appUrl}/?error=x_client_id_missing`)
  }
  
  if (!user) {
    return NextResponse.redirect(
      `${appUrl}/login?next=${encodeURIComponent('/api/auth/twitter/login')}&error=login_required`
    )
  }

  // PKCE: generate a random secret for this login attempt
  // Think of it like a one-time passcode that proves the
  // callback came from the same person who started the login
  const codeVerifier = crypto.randomBytes(32).toString('base64url')
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')

  // Remember the verifier — we'll need it when X calls back
  const response = NextResponse.redirect(
    `https://twitter.com/i/oauth2/authorize?` +
    `response_type=code` +
    `&client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
    `&scope=tweet.read%20users.read%20bookmark.read` +
    `&state=${user.id}` +
    `&code_challenge=${codeChallenge}` +
    `&code_challenge_method=S256`
  )

  // Store the verifier in a cookie so the callback can use it
  response.cookies.set('x_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10  // expires in 10 minutes
  })

  return response
}