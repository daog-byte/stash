'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';
import styles from './page.module.css';

const errorMessages: Record<string, string> = {
  login_required: 'Please log in before connecting your X account.',
  auth_failed: 'X authentication did not complete. Please try again.',
  token_failed: 'Could not finish connection to X. Please retry.',
  x_client_id_missing: 'Missing X client configuration in .env.local.',
  x_credentials_missing: 'Missing X OAuth credentials in .env.local.',
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');

  const searchParams = useSearchParams();

  const nextPath = useMemo(() => searchParams.get('next') || '/home', [searchParams]);
  const oauthError = useMemo(() => searchParams.get('error') || '', [searchParams]);
  const loginHref = useMemo(() => {
    const params = new URLSearchParams();

    if (nextPath !== '/') {
      params.set('next', nextPath);
    }

    if (oauthError) {
      params.set('error', oauthError);
    }

    const query = params.toString();
    return query ? `/login?${query}` : '/login';
  }, [nextPath, oauthError]);
  const signUpHref = useMemo(() => {
    const params = new URLSearchParams();

    if (nextPath !== '/') {
      params.set('next', nextPath);
    }

    if (oauthError) {
      params.set('error', oauthError);
    }

    const query = params.toString();
    return query ? `/signup?${query}` : '/signup';
  }, [nextPath, oauthError]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setStatus('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus(error.message);
      setIsLoading(false);
      return;
    }

    window.location.assign(nextPath);
  };

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-label="Login form">
        <header className={styles.header}>
          <p className={styles.kicker}>STASH account</p>
          <h1>Welcome back</h1>
          <p>Log in and continue connecting your saved content sources.</p>
        </header>

        {oauthError ? <p className={styles.oauthAlert}>{errorMessages[oauthError] || 'Please log in to continue.'}</p> : null}

        <div className={styles.tabRow}>
          <Link href={loginHref} className={`${styles.tab} ${styles.tabActive}`}>
            Log in
          </Link>
          <Link href={signUpHref} className={styles.tab}>
            Sign up
          </Link>
        </div>

        <div className={styles.socialRail} aria-hidden="true">
          <button type="button" className={styles.socialIconButton} disabled>
            <span>G</span>
            Google
          </button>
          <button type="button" className={styles.socialIconButton} disabled>
            <span>A</span>
            Apple
          </button>
          <button type="button" className={styles.socialIconButton} disabled>
            <span>X</span>
            X
          </button>
        </div>

        <div className={styles.separator}>
          <span>or continue with email</span>
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

          <div className={styles.metaRow}>
            <label className={styles.checkWrap}>
              <input type="checkbox" defaultChecked />
              Remember me
            </label>
            <a href="#">Forgot password?</a>
          </div>

          <button type="submit" className={styles.submit} disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        {status ? <p className={styles.formError}>{status}</p> : null}

        <p className={styles.footerLine}>
          New here? <Link href="/">Go to onboarding</Link>
        </p>

        <p className={styles.legal}>
          Protected by secure authentication infrastructure.
          <br />
          By continuing you agree to STASH terms.
        </p>
      </section>
    </main>
  );
}
