import Link from 'next/link'
import styles from './page.module.css'

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.brand}>Stash</div>
          <nav className={styles.nav}>
            <Link href="/login" className={styles.loginLink}>
              Log in
            </Link>
            <Link href="/signup" className={styles.signUpLink}>
              Sign up
            </Link>
          </nav>
        </header>

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>Built for readers who think deeply</p>
            <h1>The end of lost tabs. The beginning of better decisions.</h1>
            <p className={styles.subheadline}>
              Capture, shuffle, and synthesize. Move from passive saving to active edification.
            </p>
            <Link href="/signup" className={styles.mainCta}>
              Start Stashing for Free
            </Link>
          </div>

          <aside className={styles.heroPanel}>
            <h2>How Stash helps</h2>
            <ul className={styles.featureList}>
              <li>
                <strong>The Vault</strong>
                <span>Securely keep every source you want to revisit.</span>
              </li>
              <li>
                <strong>The Shuffle</strong>
                <span>Bring forgotten links back at the right learning moment.</span>
              </li>
              <li>
                <strong>The Decision</strong>
                <span>Use summaries and signals to choose what to read next.</span>
              </li>
            </ul>
            <div className={styles.panelActions}>
              <Link href="/signup" className={styles.agreeButton}>
                Agree and Sign up
              </Link>
              <Link href="/login" className={styles.panelLogin}>
                Already have an account?
              </Link>
            </div>
          </aside>
        </section>

        <footer className={styles.footer}>
          <span>Stash</span>
          <div className={styles.footerLinks}>
            <Link href="/login">Log in</Link>
            <Link href="/signup">Sign up</Link>
          </div>
        </footer>
      </div>
    </main>
  )
}
