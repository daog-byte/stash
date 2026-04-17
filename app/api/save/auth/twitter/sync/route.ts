import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const appUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'

  if (!user) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  // Get the stored X token for this user
  const { data: connection } = await supabase
    .from('user_connections')
    .select('access_token')
    .eq('user_id', user.id)
    .eq('platform', 'twitter')
    .single()

  if (!connection?.access_token) {
    return NextResponse.json({ error: 'X not connected' }, { status: 400 })
  }

  // First: get the user's X user ID (needed to call the bookmarks endpoint)
  const meResponse = await fetch('https://api.twitter.com/2/users/me', {
    headers: { 'Authorization': `Bearer ${connection.access_token}` }
  })
  const meData = await meResponse.json()
  const xUserId = meData.data?.id

  if (!xUserId) {
    return NextResponse.json({ error: 'Could not get X user ID' }, { status: 400 })
  }

  // Now fetch bookmarks — paginate to get up to 800
  let allBookmarks: any[] = []
  let paginationToken: string | undefined = undefined

  while (true) {
    const params = new URLSearchParams({
      max_results: '100',
      'tweet.fields': 'created_at,author_id,entities,text',
      'expansions': 'author_id',
      'user.fields': 'name,username'
    })
    if (paginationToken) params.set('pagination_token', paginationToken)

    const bookmarkResponse = await fetch(
      `https://api.twitter.com/2/users/${xUserId}/bookmarks?${params}`,
      { headers: { 'Authorization': `Bearer ${connection.access_token}` } }
    )

    const bookmarkData = await bookmarkResponse.json()

    if (!bookmarkData.data?.length) break

    // Build a lookup map so we can match tweets to their authors
    const userMap: Record<string, any> = {}
    for (const u of bookmarkData.includes?.users ?? []) {
      userMap[u.id] = u
    }

    for (const tweet of bookmarkData.data) {
      const author = userMap[tweet.author_id] ?? {}
      const linkedUrl = tweet.entities?.urls?.find(
        (u: any) => !u.expanded_url?.includes('t.co')
      )?.expanded_url

      allBookmarks.push({
        user_id: user.id,
        url: linkedUrl ?? `https://x.com/${author.username}/status/${tweet.id}`,
        title: tweet.text.slice(0, 120),
        raw_text: tweet.text,
        platform: 'twitter',
        platform_id: tweet.id,
        author: author.name,
        saved_at: tweet.created_at,
        read: false,
        priority: 'pending',
        summary: null  // AI enrichment runs separately
      })
    }

    // If X gives us a next page token, keep going. Otherwise stop.
    paginationToken = bookmarkData.meta?.next_token
    if (!paginationToken) break
  }

  // Save everything — skip any we already have (no duplicates)
  const { error } = await supabase
    .from('links')
    .upsert(allBookmarks, { onConflict: 'user_id,platform_id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.redirect(
    `${appUrl}/?synced=${allBookmarks.length}`
  )
}