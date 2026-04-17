'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import styles from './page.module.css';

interface SavedLink {
  id: string;
  url: string;
  title: string;
  summary: string;
  created_at: string;
  tags: string[];
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [savedLinks, setSavedLinks] = useState<SavedLink[]>([]);
  const [showXPrompt, setShowXPrompt] = useState(false);
  const [hasShownPrompt, setHasShownPrompt] = useState(false);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        setIsLoading(false);
      } else {
        // Redirect to login if not authenticated
        window.location.href = '/login?next=/dashboard';
      }
    };

    checkAuth();
  }, []);

  // Handle URL paste/input
  const handleSaveLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!urlInput.trim()) {
      setSaveStatus('Please enter a URL');
      return;
    }

    setIsSaving(true);
    setSaveStatus('');

    try {
      // Validate URL
      try {
        new URL(urlInput);
      } catch {
        throw new Error('Invalid URL. Please enter a valid web link.');
      }

      const response = await fetch('/api/save/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save link');
      }

      const newLink: SavedLink = await response.json();

      // Add to list and clear input
      setSavedLinks([newLink, ...savedLinks]);
      setUrlInput('');
      setSaveStatus('Link saved! ✓');

      // Show X prompt if this is the first save
      if (!hasShownPrompt && savedLinks.length === 0) {
        setTimeout(() => {
          setShowXPrompt(true);
          setHasShownPrompt(true);
        }, 800);
      }

      // Clear status after 3 seconds
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  const dismissXPrompt = () => {
    setShowXPrompt(false);
  };

  if (isLoading) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingContainer}>
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <nav className={styles.topBar}>
        <h1 className={styles.logo}>STASH</h1>
        <div className={styles.userInfo}>
          <span>{userEmail}</span>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/';
            }}
            className={styles.signOutBtn}
          >
            Sign out
          </button>
        </div>
      </nav>

      <section className={styles.main}>
        {savedLinks.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyContent}>
              <h2>Your STASH</h2>
              <p className={styles.subtitle}>Paste a link below. We&rsquo;ll enrich it with AI.</p>

              <form onSubmit={handleSaveLink} className={styles.pasteForm}>
                <input
                  type="text"
                  placeholder="Paste a link here..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className={styles.urlInput}
                  disabled={isSaving}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isSaving || !urlInput.trim()}
                  className={styles.submitBtn}
                >
                  {isSaving ? 'Enriching...' : 'Save'}
                </button>
              </form>

              {saveStatus && (
                <div className={`${styles.statusMessage} ${isSaving ? styles.statusLoading : ''}`}>
                  {saveStatus}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.linksContainer}>
            <form onSubmit={handleSaveLink} className={styles.compactForm}>
              <input
                type="text"
                placeholder="Paste another link..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className={styles.compactInput}
                disabled={isSaving}
              />
              <button
                type="submit"
                disabled={isSaving || !urlInput.trim()}
                className={styles.compactSubmitBtn}
              >
                {isSaving ? 'Saving...' : 'Add'}
              </button>
            </form>

            {saveStatus && (
              <div className={`${styles.statusMessage} ${isSaving ? styles.statusLoading : ''}`}>
                {saveStatus}
              </div>
            )}

            <ul className={styles.linksList}>
              {savedLinks.map((link) => (
                <li key={link.id} className={styles.linkItem}>
                  <div className={styles.linkContent}>
                    <h3 className={styles.linkTitle}>{link.title || link.url}</h3>
                    {link.summary && <p className={styles.linkSummary}>{link.summary}</p>}
                    {link.tags?.length > 0 && (
                      <div className={styles.tagsContainer}>
                        {link.tags.map((tag) => (
                          <span key={tag} className={styles.tag}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className={styles.linkUrl}>
                      {new URL(link.url).hostname}
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* X Connect Prompt Modal */}
      {showXPrompt && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <button className={styles.closeBtn} onClick={dismissXPrompt}>
              ✕
            </button>
            <div className={styles.modalContent}>
              <p className={styles.modalEyebrow}>Import more content</p>
              <h2>Want to import your X bookmarks too?</h2>
              <p className={styles.modalDescription}>
                Connect your X account and we&rsquo;ll pull in all your bookmarks automatically.
              </p>
              <div className={styles.modalActions}>
                <button className={styles.dismissBtn} onClick={dismissXPrompt}>
                  Not now
                </button>
                <a href="/api/auth/twitter/login?next=/dashboard" className={styles.connectXBtn}>
                  Connect to X
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
