import { handleAuth } from '@workos-inc/authkit-nextjs'
import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

function looksLikeUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export const GET = handleAuth({
  returnPathname: '/home',
  onSuccess: async ({ user }) => {
    const email = user.email

    if (!email) {
      return
    }

    const hasAdminEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)

    if (!hasAdminEnv) {
      console.warn('Skipping profile sync after WorkOS login because Supabase admin env is missing.')
      return
    }

    try {
      const supabaseAdmin = createSupabaseAdminClient()
      const { data: existingProfiles, error: lookupError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .limit(1)

      if (lookupError) {
        throw lookupError
      }

      if (!existingProfiles || existingProfiles.length === 0) {
        const insertPayload: Record<string, string> = { email }

        if (looksLikeUuid(user.id)) {
          insertPayload.id = user.id
        }

        const { error: insertError } = await supabaseAdmin.from('profiles').insert(insertPayload)

        if (insertError && insertError.code !== '23505') {
          throw insertError
        }
      }
    } catch (error) {
      console.warn('WorkOS login succeeded but profile sync was skipped.', error)
    }
  },
  onError: async ({ request, error }) => {
    console.error('WorkOS callback failed', error)
    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
  },
})
