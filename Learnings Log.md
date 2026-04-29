# STASH "Value First" Dashboard Setup Guide

## Learning Log Entries

### [2026-04-24 16:20] Fast capture UX needs focus defaults and graceful permission fallbacks
In Lehman terms: for quick-save modals to feel instant, the input must auto-focus so users can paste immediately. Also, if Supabase blocks write with RLS, the app should not dead-end; it should still store locally and explain what happened. Keeping search controls fixed at the top of /search also matches user expectation from music-app style interfaces.

### [2026-04-24 16:05] Interaction parity needs behavior-level matching, not just visual matching
In Lehman terms: copying the look of Spotify/Shiori is not enough. The key was making +Create open as a true overlay modal (not inline content) and making Search behave with real idle/hover/focus states plus a dropdown that appears on focus. Once that behavior exists, the sidebar Search item can be removed because the top search panel becomes the actual search engine entry point.

### [2026-04-24 15:45] Complex UX requests only work when data flows are made schema-tolerant first
In Lehman terms: adding tabs, search controls, and creation popups is not enough if the database shape is inconsistent. We had to make save/load logic fallback safely when columns like user_id or read are missing, so the UI can still work while you continue testing end-to-end.

### [2026-04-23 18:12] Account actions should live where users expect control actions, and the home screen needs a capture entry point
In Lehman terms: if people cannot see where to sign out or paste a link, the app feels unfinished even if the data screens already exist. Moving Account into the sidebar's bottom control area makes it feel like a settings destination, and adding a "Save a link..." input on Home gives users an immediate first action instead of a dead end.

### [2026-04-23 17:37] Shuffle feels smarter when weights reflect urgency plus age, not pure randomness
In Lehman terms: random picks can keep showing low-value links, so we added a weighted shuffle API that favors urgent items and older unread backlog items. Then we connected it to Link Detail with a "Shuffle next" action and archive toggle, so deciding and moving to the next best item is one flow.

### [2026-04-23 17:22] De-cluttering navigation works better when actions move closer to where users already are
In Lehman terms: instead of keeping Search as a permanent sidebar tab, we removed it from the left nav and put an Archive button right beside the search box. This keeps the sidebar cleaner and makes Archive feel like part of the search flow, not a separate feature hunt.

### [2026-04-23 17:08] Suggestion chips work best when tied to focus state and real unread history
In Lehman terms: instead of showing random chips all the time, the app now only shows monthly suggestion chips when the search box is active and empty. Each chip comes from real unread saves (one per month, up to 6 months), and tapping a chip marks it as read before opening the link. This keeps search calm, useful, and connected to actual backlog cleanup.

### [2026-04-23 16:55] Smooth collapse needs CSS transitions and persistent DOM labels
In Lehman terms: if label text is removed instantly in React, collapse feels abrupt. Keeping labels in the DOM and animating width/opacity gives a true drawer-opening and drawer-closing motion. Also, icon size can be tuned by state (20px when collapsed) so navigation still feels readable.

### [2026-04-23 16:35] Turning a wireframe list into a working home screen needs state + rules, not static text
In Lehman terms: instead of just showing what the screen should have, Step 1 built a real `/home` feed using Supabase data, with tabs, filters, sorting, curated max-5 cards, and actions. Lesson: to move from mock UI to product UI, each section needs data logic (what to fetch), decision logic (how to filter/sort), and interaction logic (what happens on click).

### [2026-04-23 10:40] A mixed auth setup can strand users after email verification
In Lehman terms: sign up was still using Supabase email verification, but login was changed to WorkOS-only. So after a user clicked the verify link, they landed on login but had no valid way to continue. Lesson: signup and login must always use matching auth paths.

### [2026-04-23 10:50] Always keep a fallback login path when external auth is not configured
In Lehman terms: if WorkOS keys are not in .env.local, users should still get a real login form, not a dead-end message. This keeps progress moving while setup is incomplete.

### [2026-04-23 11:00] Verification links can create sessions silently
In Lehman terms: when users click email verification links, they can already be signed in in the background. Login pages should check for an existing session and auto-redirect instead of making users retype credentials.

### [2026-04-23 11:10] Landing page conversion should not block product onboarding
In Lehman terms: a polished split-screen landing page helps conversion, but auth routes still need to work end-to-end. Visual upgrades and auth reliability must ship together.

### [2026-04-23 11:20] Capture each release as a learning immediately
In Lehman terms: writing what changed, why it broke, and how it was fixed right away makes future debugging faster and reduces repeat mistakes.

### [2026-04-20 09:00] WorkOS is now the front door for sign-in
In Lehman terms: users now click one login button, go to WorkOS to prove who they are, and come back already signed in. This removes custom password handling from your app and gives you a cleaner auth flow.

### [2026-04-20 09:05] Callback route is the handshake point
In Lehman terms: the callback is like the handover desk. WorkOS sends back a one-time code, your app checks it, then saves a secure login cookie so the user stays signed in.

### [2026-04-20 09:10] Supabase profile auto-creation is now built in
In Lehman terms: once WorkOS confirms the user, your app checks if that email already has a row in public.profiles. If not, it creates one automatically, so links can always be tied to an owner.

### [2026-04-20 09:15] Service role key is only for server-side trusted work
In Lehman terms: the service role key is a master key. It must stay on the server and is used only in protected backend code to create or check profile rows safely.

### [2026-04-20 09:20] Route protection now blocks most pages until login
In Lehman terms: almost every route is protected by auth, except the login page and callback route. That means users must sign in before seeing private app pages.

### [2026-04-20 09:25] Environment variables drive the full auth setup
In Lehman terms: if the WorkOS and Supabase env values are missing, auth breaks. Keeping a clear .env template makes setup faster and avoids hidden config mistakes.

### [2026-04-20 09:30] Next.js 16 prefers proxy naming over middleware
In Lehman terms: Next.js 16 is moving from middleware.ts to proxy.ts naming. middleware.ts still works in many cases, but proxy is the newer convention to keep in mind.

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
