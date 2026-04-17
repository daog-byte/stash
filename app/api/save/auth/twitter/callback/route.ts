import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { searchParams } = new URL(request.url)
  const appUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
  const callbackUrl = new URL('/api/auth/twitter/callback', appUrl).toString()
  const clientId = process.env.X_CLIENT_ID
  const clientSecret = process.env.X_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${appUrl}/?error=x_credentials_missing`)
  }

  const code = searchParams.get('code')
  const codeVerifier = request.cookies.get('x_code_verifier')?.value

  if (!code || !codeVerifier || !user) {
    return NextResponse.redirect(`${appUrl}/?error=auth_failed`)
  }

  // Swap the temporary code for a real access token
  const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(
        `${clientId}:${clientSecret}`
      ).toString('base64')}`
    },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: callbackUrl,
      code_verifier: codeVerifier
    })
  })

  const tokens = await tokenResponse.json()

  if (!tokens.access_token) {
    return NextResponse.redirect(`${appUrl}/?error=token_failed`)
  }

  // Store the token in Supabase linked to this STASH user
  await supabase.from('user_connections').upsert({
    user_id: user.id,
    platform: 'twitter',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    connected_at: new Date().toISOString()
  })

  // Send them to the sync route to immediately pull their bookmarks
  return NextResponse.redirect(`${appUrl}/api/twitter/sync`)
}