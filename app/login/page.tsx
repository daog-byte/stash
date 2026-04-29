import LoginFallback from './login-fallback'

export default function LoginPage() {
  const redirectUri = process.env.WORKOS_REDIRECT_URI ?? process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI

  if (!process.env.WORKOS_CLIENT_ID || !process.env.WORKOS_API_KEY || !process.env.WORKOS_COOKIE_PASSWORD || !redirectUri) {
    return <LoginFallback />
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
      <section style={{ maxWidth: 560, width: '100%', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.25rem' }}>
        <p style={{ letterSpacing: '0.08em', fontSize: 12, marginBottom: 8 }}>STASH</p>
        <h1 style={{ marginTop: 0 }}>Sign in</h1>
        <p>Continue with WorkOS AuthKit to access your saved links.</p>
        <a
          href="/api/auth/login?returnTo=/home"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 12,
            padding: '0.625rem 0.9rem',
            borderRadius: 10,
            border: '1px solid #111827',
            textDecoration: 'none',
            color: '#111827',
            fontWeight: 600,
          }}
        >
          Continue with WorkOS
        </a>
      </section>
    </main>
  )
}
