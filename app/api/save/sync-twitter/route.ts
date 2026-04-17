import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// X's hardcoded Bearer token — same one their web app sends
const BEARER_TOKEN = 'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA'

// The BookmarkTimeline query ID — may need updating if X rotates it
// To find the current one: open x.com, open DevTools → Network,
// filter for "BookmarkTimeline", copy the queryId from the URL
const BOOKMARK_QUERY_ID = 'f0AlQdUGMx1wQRUUFV0V4A'

// Feature flags — copied from what x.com sends in its own requests
const FEATURES = {
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
  view_counts_everywhere_api_enabled: true,
  longform_notetweets_consumption_enabled: true,
  responsive_web_twitter_article_tweet_consumption_enabled: false,
  tweet_awards_web_tipping_enabled: false,
  freedom_of_speech_not_reach_fetch_enabled: true,
  standardized_nudges_misinfo: true,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  rweb_video_timestamps_enabled: true,
  longform_notetweets_rich_text_read_enabled: true,
  longform_notetweets_inline_media_enabled: true,
  responsive_web_graphql_exclude_directive_enabled: true,
  verified_phone_label_enabled: false,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  responsive_web_graphql_timeline_navigation_enabled: true,
  responsive_web_enhance_cards_enabled: false
}

async function fetchBookmarkPage(
  authToken: string,
  ct0: string,
  cursor?: string
) {
  const variables = {
    count: 100,            // max per page
    ...(cursor && { cursor }),
    includePromotedContent: false
  }

  const url = `https://x.com/i/api/graphql/${BOOKMARK_QUERY_ID}/BookmarkTimeline?variables=${encodeURIComponent(JSON.stringify(variables))}&features=${encodeURIComponent(JSON.stringify(FEATURES))}`

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${BEARER_TOKEN}`,
      'Cookie': `auth_token=${authToken}; ct0=${ct0}`,
      'x-csrf-token': ct0,
      'Content-Type': 'application/json',
      'x-twitter-auth-type': 'OAuth2Session',
      'x-twitter-client-language': 'en',
      'x-twitter-active-user': 'yes',
      'Referer': 'https://x.com/i/bookmarks',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  })

  if (!response.ok) {
    throw new Error(`X API responded with ${response.status}`)
  }

  return response.json()
}

function extractBookmarksFromResponse(data: any) {
  // Navigate X's deeply nested GraphQL response
  const instructions =
    data?.data?.bookmark_timeline_v2?.timeline?.instructions ?? []

  const bookmarks: any[] = []
  let nextCursor: string | null = null

  for (const instruction of instructions) {
    if (instruction.type === 'TimelineAddEntries') {
      for (const entry of instruction.entries ?? []) {
        // Cursor entries tell us how to get the next page
        if (entry.entryId?.startsWith('cursor-bottom')) {
          nextCursor = entry.content?.value ?? null
          continue
        }

        // Tweet entries are the actual bookmarks
        const tweet = entry.content?.itemContent?.tweet_results?.result
        if (!tweet) continue

        const legacy = tweet.legacy ?? {}
        const user = tweet.core?.user_results?.result?.legacy ?? {}

        bookmarks.push({
          tweet_id: legacy.id_str,
          text: legacy.full_text,
          created_at: legacy.created_at,
          author_name: user.name,
          author_username: user.screen_name,
          author_avatar: user.profile_image_url_https,
          url: `https://x.com/${user.screen_name}/status/${legacy.id_str}`,
          like_count: legacy.favorite_count,
          retweet_count: legacy.retweet_count,
          // Extract any linked URLs from the tweet
          linked_url: legacy.entities?.urls?.[0]?.expanded_url ?? null,
          platform: 'twitter'
        })
      }
    }
  }

  return { bookmarks, nextCursor }
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  // Fetch the user's stored X credentials
  const { data: connection } = await supabase
    .from('user_connections')
    .select('auth_token, ct0')
    .eq('user_id', user.id)
    .eq('platform', 'twitter')
    .single()

  if (!connection) {
    return NextResponse.json(
      { error: 'X account not connected. Visit /connect-twitter first.' },
      { status: 400 }
    )
  }

  const { auth_token, ct0 } = connection
  
  let allBookmarks: any[] = []
  let cursor: string | undefined = undefined
  let pageCount = 0
  const MAX_PAGES = 100  // safety limit — 100 pages × 100 per page = 10,000 bookmarks

  // Paginate through ALL bookmarks — no 99-item limit
  while (pageCount < MAX_PAGES) {
    const data = await fetchBookmarkPage(auth_token, ct0, cursor)
    const { bookmarks, nextCursor } = extractBookmarksFromResponse(data)

    if (bookmarks.length === 0) break  // nothing left

    allBookmarks = allBookmarks.concat(bookmarks)
    pageCount++

    // 2-second pause between pages to be respectful of X's servers
    await new Promise(resolve => setTimeout(resolve, 2000))

    if (!nextCursor) break  // reached the end
    cursor = nextCursor
  }

  // Save all bookmarks to Supabase, skip any we already have
  let saved = 0
  for (const bookmark of allBookmarks) {
    const { error } = await supabase
      .from('links')
      .upsert({
        user_id: user.id,
        url: bookmark.linked_url ?? bookmark.url,
        title: bookmark.text.slice(0, 100),
        platform: 'twitter',
        platform_id: bookmark.tweet_id,
        author: bookmark.author_name,
        raw_text: bookmark.text,
        saved_at: new Date(bookmark.created_at).toISOString(),
        read: false,
        priority: 'pending'
      }, {
        onConflict: 'user_id,platform_id'  // don't duplicate
      })

    if (!error) saved++
  }

  return NextResponse.json({
    success: true,
    total_fetched: allBookmarks.length,
    total_saved: saved,
    pages_fetched: pageCount
  })
}