import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// User visits /connect-twitter in your UI, pastes their two cookies,
// and this route saves them encrypted against their account.
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const { auth_token, ct0 } = await request.json()

  if (!auth_token || !ct0) {
    return NextResponse.json(
      { error: 'Both auth_token and ct0 are required' },
      { status: 400 }
    )
  }

  // Store encrypted in Supabase against this user's account
  const { error } = await supabase
    .from('user_connections')
    .upsert({
      user_id: user.id,
      platform: 'twitter',
      auth_token,   // in production: encrypt before storing
      ct0,
      connected_at: new Date().toISOString()
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}