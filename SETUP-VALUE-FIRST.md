# STASH "Value First" Dashboard Setup Guide

## What's Changed

The onboarding flow has been pivoted to a **"value first" approach**:

1. **Home page** (`/`) → Paste input immediately visible (no login required)
2. **Paste & Enrich** → Link enriched with Claude AI + saved to browser
3. **See Value** → Enriched link displayed with title, summary, tags
4. **Connect X nudge** → Gentle modal prompts to import X bookmarks
5. **Sign Up** (optional) → User can log in to save permanently + sync X

**The key difference:** Users see the value BEFORE being asked to connect X. They can paste and enrich links immediately, with login becoming a gentle prompt rather than a gate.

## Setup Instructions

### 1. Set Up Supabase Database Schema

Run the SQL from `supabase-schema.sql` in your Supabase dashboard:

**Steps:**
- Go to [Supabase Dashboard](https://app.supabase.com)
- Select your project
- Go to SQL Editor → Create a new query
- Copy the entire contents of `/supabase-schema.sql`
- Paste and run

**Tables created:**
- `links` - Stores user-saved links with enriched metadata
- `user_connections` - Stores OAuth provider tokens (X, etc.)

### 2. Configure Environment Variables

Add these to `.env.local`:

```bash
# Anthropic API (required for link enrichment)
ANTHROPIC_API_KEY=sk_...  # Get from https://console.anthropic.com

# Existing Supabase vars (should already be set)
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 3. Install Dependencies

```bash
npm install
```

Anthropic SDK will be installed automatically from updated `package.json`.

### 4. Test the Flow

**Local dev:**
```bash
npm run dev
```

Then visit: http://localhost:3000

**Complete "value first" flow:**
1. Go to http://localhost:3000 (home page)
2. See empty state with paste input ✓
3. Paste a link (e.g., `https://www.wikipedia.org/wiki/Bookmark`)
4. Watch it enrich (should take 2-3 seconds)
5. See enriched result with title, summary, tags ✓
6. Modal pops up: "Want to import your X bookmarks too?" ✓
7. Click "Not now" → keep stashing links (stored in browser)
8. Or click "Connect to X" → redirected to login
9. After login → returned to X OAuth flow
10. X bookmarks synced (existing flow)

**Alternative flow (explicit sign up):**
- At any point, click "Log in to sync and save permanently" link
- Sign up or log in
- Links sync to your account (future enhancement)

## File Structure

```
app/
  page.tsx                  # HOME - Paste input + enrich (no auth required)
  page.module.css           # Homepage styles + modal styles
  dashboard/
    page.tsx                # Dashboard (auth-gated, for logged-in users)
    page.module.css         # Dashboard styles
  api/
    save/
      link/
        route.ts            # POST /api/save/link - enrich & save (guest + auth)
  login/
    page.tsx                # UPDATED: redirects to /dashboard after auth
  signup/
    page.tsx                # UPDATED: redirects to /dashboard after auth
  lib/
    supabase.js             # Supabase client

supabase-schema.sql         # Schema setup - run in Supabase dashboard
```

## How It Works

### Link Enrichment Flow (Guest)

```
User visits http://localhost:3000
    ↓
Sees STASH paste input (empty state)
    ↓
User pastes URL
    ↓
POST /api/save/link { url }
    ↓
Fetch metadata (title, description) from URL
    ↓
Send to Claude API: "Extract title, summary, tags"
    ↓
API returns enriched data (no DB save for guests)
    ↓
Frontend stores in localStorage
    ↓
Display enriched link on page
    ↓
If first save → Show "Connect X" modal
    ↓
User can:
  - Click "Not now" → keep pasting links (all in browser)
  - Click "Connect to X" → go to login → then OAuth
```

### Link Enrichment Flow (Authenticated)

```
Logged-in user on home page or dashboard
    ↓
Pastes URL
    ↓
POST /api/save/link { url }
    ↓
API detects authenticated session
    ↓
Enriches link + saves to Supabase (user_id attached)
    ↓
Returns saved link with ID
    ↓
Frontend displays + adds to list
    ↓
Links persist across sessions
```

### Guest Links Storage

- **Location:** `localStorage['stash-guest-links']`
- **Format:** Array of enriched link objects with temporary IDs
- **Persistence:** Until browser cache cleared
- **Migration:** When user signs up, can prompt to save guest links to account (future enhancement)

## API Routes

### POST /api/save/link

Supports both **guest users** (returns enriched data) and **authenticated users** (saves to DB).

**Request:**
```json
{
  "url": "https://example.com/article"
}
```

**Response (guest user):**
```json
{
  "id": "guest-1712973000000-a1b2c3d4e",
  "url": "https://example.com/article",
  "title": "Article Title",
  "summary": "2-3 sentence summary of what this is about",
  "tags": ["category1", "category2", "category3"],
  "created_at": "2024-04-13T15:30:00Z"
}
```

**Response (authenticated user):**
```json
{
  "id": "uuid",
  "url": "https://example.com/article",
  "title": "Article Title",
  "summary": "2-3 sentence summary of what this is about",
  "tags": ["category1", "category2", "category3"],
  "created_at": "2024-04-13T15:30:00Z",
  "user_id": "user-uuid"
}
```

**Response (error):**
```json
{
  "error": "Invalid URL format" // or other error message
}
```

**Auth:**
- **Optional** - works with or without authenticated session
- If authenticated → saves to database with `user_id`
- If guest → returns enriched data for client-side storage only

## Database Schema

### links table

```sql
id              UUID        (primary key)
user_id         UUID        (foreign key to auth.users)
url             TEXT        (the link URL)
title           TEXT        (enriched title)
summary         TEXT        (enriched 2-3 sentence summary)
tags            TEXT[]      (array of 3-5 tags)
created_at      TIMESTAMP   (ISO 8601)
updated_at      TIMESTAMP   (auto-updated)
```

**Indexes:**
- `user_id` (fast filtering by user)
- `created_at DESC` (recent links first)
- `tags` (GIN index for tag filtering)

**Row Level Security (RLS):**
- Users can only see/edit/delete their own links

## Troubleshooting

### "Unauthorized. Please log in."
- Make sure you've signed up/logged in first
- Check that Supabase session is valid
- Try signing out and back in

### "Invalid URL format"
- Paste a valid HTTP(S) URL
- Examples that work:
  - `https://www.wikipedia.org/wiki/Example`
  - `https://github.com/usernamerepo`
  - `https://medium.com/@user/article-title`

### Link enrichment takes too long (5+ seconds)
- Claude API call is slow
- Normal: 2-3 seconds, but can be 5-10s depending on URL complexity
- Check `ANTHROPIC_API_KEY` is valid

### Modal doesn't appear after first save
- Check browser console for errors
- Make sure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Verify Supabase session exists

### X OAuth callback fails
- Make sure X OAuth credentials are set in `.env.local`:
  - `X_CLIENT_ID`
  - `X_CLIENT_SECRET`
  - `X_CALLBACK_URL` (default: `http://localhost:3000/api/auth/twitter/callback`)
- Verify callback URL matches X Developer portal settings

## Next Steps

### Future Enhancements
- [ ] Search/filter links by tags or keyword
- [ ] Edit link title/summary manually
- [ ] Delete links
- [ ] X bookmarks sync (completes existing flow)
- [ ] Install to mobile (PWA)
- [ ] Export/backup links
- [ ] Bulk paste (paste multiple links at once)
- [ ] Link previews (thumbnail images)

### Optimization
- Add caching for enrichment results (avoid re-enriching same URLs)
- Batch enrich multiple links (if bulk paste added)
- Add rate limiting to `/api/save/link`

### Monitoring
- Set up error logging (e.g., Sentry) for failed enrichments
- Monitor Claude API costs
- Track user engagement metrics

## Questions?

See conversation history or check:
- [Anthropic API Docs](https://docs.anthropic.com)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
