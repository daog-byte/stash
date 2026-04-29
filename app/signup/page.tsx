'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';
import styles from '../login/page.module.css';

const errorMessages: Record<string, string> = {
  login_required: 'Create an account or log in before connecting your X account.',
  auth_failed: 'X authentication did not complete. You can try again after signing up.',
  token_failed: 'Could not finish connection to X. Sign up or log in and retry.',
  x_client_id_missing: 'Missing X client configuration in .env.local.',
  x_credentials_missing: 'Missing X OAuth credentials in .env.local.',
};

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [weeklyDigestOptIn, setWeeklyDigestOptIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');

  const nextPath = useMemo(() => searchParams.get('next') || '/home', [searchParams]);
  const oauthError = useMemo(() => searchParams.get('error') || '', [searchParams]);
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setStatus('');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          referral_code: referralCode || null,
          weekly_digest_opt_in: weeklyDigestOptIn,
          digest_day: 'monday',
          marketing_opt_in: weeklyDigestOptIn,
        },
      },
    });

    if (error) {
      setStatus(error.message);
      setIsLoading(false);
      return;
    }

    if (data.session) {
      window.location.assign(nextPath);
      return;
    }

    setStatus('Account created. Check your email to verify your address, then log in to continue.');
    setIsLoading(false);
  };

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-label="Sign up form">
        <header className={styles.header}>
          <p className={styles.kicker}>STASH account</p>
          <h1>Create your account</h1>
          <p>Start syncing your saved posts and bookmarks into one place.</p>
        </header>

        {oauthError ? <p className={styles.oauthAlert}>{errorMessages[oauthError] || 'Sign up to continue.'}</p> : null}

        <div className={styles.tabRow}>
          <Link href={loginHref} className={styles.tab}>
            Log in
          </Link>
          <Link href={signUpHref} className={`${styles.tab} ${styles.tabActive}`}>
            Sign up
          </Link>
        </div>

        <div className={styles.socialRail} aria-hidden="true">
          <button type="button" className={styles.socialIconButton} disabled>
            <span>A</span>
            Apple
          </button>
          <button type="button" className={styles.socialIconButton} disabled>
            <span>G</span>
            Google
          </button>
          <button type="button" className={styles.socialIconButton} disabled>
            <span>F</span>
            Facebook
          </button>
        </div>

        <div className={styles.separator}>
          <span>or create with email</span>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label htmlFor="firstName">First name</label>
          <input
            id="firstName"
            type="text"
            autoComplete="given-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
            placeholder="Ada"
          />

          <label htmlFor="lastName">Last name (optional)</label>
          <input
            id="lastName"
            type="text"
            autoComplete="family-name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            placeholder="Lovelace"
          />

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
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
            placeholder="Choose a secure password"
          />
          <p className={styles.hint}>Use 8+ characters with a mix of letters, numbers, and symbols.</p>

          <label htmlFor="referralCode">Referral or voucher code</label>
          <input
            id="referralCode"
            type="text"
            value={referralCode}
            onChange={(event) => setReferralCode(event.target.value)}
            placeholder="Optional"
          />

          <label className={styles.checkWrap}>
            <input
              type="checkbox"
              checked={weeklyDigestOptIn}
              onChange={(event) => setWeeklyDigestOptIn(event.target.checked)}
            />
            Send me a weekly digest of my saved posts via email.
          </label>

          <button type="submit" className={styles.submit} disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Agree and sign up'}
          </button>
        </form>

        {status ? <p className={styles.formError}>{status}</p> : null}

        <p className={styles.footerLine}>
          Already have an account? <Link href={loginHref}>Log in</Link>
        </p>

        <p className={styles.legal}>
          By signing up for a STASH account, you agree to the terms and acknowledge our privacy policy.
        </p>
      </section>
    </main>
  );
}
