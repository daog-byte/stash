'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'
import styles from './page.module.css'

const errorMessages: Record<string, string> = {
  login_required: 'Please log in before continuing.',
  auth_failed: 'Authentication did not complete. Please try again.',
  token_failed: 'Could not finish sign-in. Please retry.',
}

export default function LoginFallback() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState('')

  const nextPath = useMemo(() => searchParams.get('next') || '/home', [searchParams])
  const oauthError = useMemo(() => searchParams.get('error') || '', [searchParams])
  const loginHref = useMemo(() => {
    const params = new URLSearchParams()

    if (nextPath !== '/') {
      params.set('next', nextPath)
    }

    if (oauthError) {
      params.set('error', oauthError)
    }

    const query = params.toString()
    return query ? `/login?${query}` : '/login'
  }, [nextPath, oauthError])
  const signUpHref = useMemo(() => {
    const params = new URLSearchParams()

    if (nextPath !== '/') {
      params.set('next', nextPath)
    }

    if (oauthError) {
      params.set('error', oauthError)
    }

    const query = params.toString()
    return query ? `/signup?${query}` : '/signup'
  }, [nextPath, oauthError])

  useEffect(() => {
    let isMounted = true

    async function checkSession() {
      const { data } = await supabase.auth.getSession()

      if (isMounted && data.session) {
        window.location.assign(nextPath)
      }
    }

    void checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        window.location.assign(nextPath)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [nextPath])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setStatus('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setStatus(error.message)
      setIsLoading(false)
      return
    }

    window.location.assign(nextPath)
  }

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-label="Login form">
        <header className={styles.header}>
          <p className={styles.kicker}>STASH account</p>
          <h1>Welcome back</h1>
          <p>Log in with the email and password you used when you signed up.</p>
        </header>

        {oauthError ? <p className={styles.oauthAlert}>{errorMessages[oauthError] || 'Please log in to continue.'}</p> : null}

        <p className={styles.oauthAlert}>
          If you just verified your email, give this page a second. If a session was created from the email link, we&apos;ll continue automatically.
        </p>

        <div className={styles.tabRow}>
          <Link href={loginHref} className={`${styles.tab} ${styles.tabActive}`}>
            Log in
          </Link>
          <Link href={signUpHref} className={styles.tab}>
            Sign up
          </Link>
        </div>

        <div className={styles.separator}>
          <span>continue with email</span>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="name@example.com"
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            placeholder="Enter your password"
          />

          <button type="submit" className={styles.submit} disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        {status ? <p className={styles.formError}>{status}</p> : null}

        <p className={styles.footerLine}>
          Need an account? <Link href={signUpHref}>Sign up</Link>
        </p>
      </section>
    </main>
  )
}