'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useSearchSuggestions } from './search/use-search-suggestions';

const navItems = [
  { href: '/home', icon: '⌂', label: 'My Stash' },
  { href: '/topics', icon: '#', label: 'Topics' },
  { href: '/tidy', icon: '✓', label: 'Tidy Up' },
];

function isActive(pathname: string, href: string) {
  if (href === '/home') return pathname === '/home';
  if (href === '/account') return pathname.startsWith('/account');
  if (href === '/topics') return pathname.startsWith('/topics') || pathname.startsWith('/link/');
  return pathname.startsWith(href);
}

export function SidebarShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [createUrl, setCreateUrl] = useState('');
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Search header state
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchHovered, setSearchHovered] = useState(false);
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(null);
  const [searchActionError, setSearchActionError] = useState('');
  const { suggestions, isLoading: suggestionsLoading, error: suggestionsError, refreshSuggestions } = useSearchSuggestions();

  const filteredResults = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return [];
    return suggestions.filter((item) => {
      const inTitle = item.title.toLowerCase().includes(normalizedQuery);
      const inPlatform = (item.platform || '').toLowerCase().includes(normalizedQuery);
      return inTitle || inPlatform;
    });
  }, [searchQuery, suggestions]);

  const dropdownItems = searchQuery.trim() ? filteredResults : suggestions;

  async function handleSuggestionOpen(suggestionId: string) {
    setActiveSuggestionId(suggestionId);
    setSearchActionError('');

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setSearchActionError(userError?.message || 'You must be logged in to open suggestions.');
      setActiveSuggestionId(null);
      return;
    }

    let updateResult = await supabase
      .from('links')
      .update({ read: true })
      .eq('id', suggestionId)
      .eq('user_id', user.id);

    if (updateResult.error && updateResult.error.message.includes('user_id')) {
      updateResult = await supabase.from('links').update({ read: true }).eq('id', suggestionId);
    }

    const updateError = updateResult.error;
    if (updateError && !updateError.message.includes('read')) {
      setSearchActionError(updateError.message);
      setActiveSuggestionId(null);
      return;
    }

    await refreshSuggestions();
    router.push(`/link/${suggestionId}`);
  }

  const title = useMemo(() => {
    if (pathname.startsWith('/link/')) return 'Link Detail';
    if (pathname.startsWith('/archive')) return 'Archive';
    if (pathname.startsWith('/topics')) return 'Topics';
    if (pathname.startsWith('/tidy')) return 'Tidy Up';
    if (pathname.startsWith('/account')) return 'Account';
    return 'My Stash';
  }, [pathname]);

  async function handleCreateSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError('');

    const trimmedUrl = createUrl.trim();
    if (!trimmedUrl) {
      setCreateError('Paste a valid link first.');
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(trimmedUrl);
    } catch {
      setCreateError('That does not look like a valid URL.');
      return;
    }

    setIsCreating(true);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setCreateError(userError?.message || 'Log in before saving links.');
      setIsCreating(false);
      return;
    }

    const fallbackTitle = parsedUrl.hostname.replace(/^www\./, '');

    const response = await fetch('/api/save/link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: trimmedUrl,
        userId: user.id,
      }),
    });

    const payload = (await response.json()) as {
      error?: string;
      savedToDb?: boolean;
      id?: string;
      url?: string;
      title?: string;
      summary?: string;
      tag?: string;
      platform?: string;
      created_at?: string;
    };

    if (!response.ok) {
      setCreateError(payload.error || 'Could not save this link right now.');
      setIsCreating(false);
      return;
    }

    if (!payload.savedToDb) {
      const existing = window.localStorage.getItem('stash-guest-links');
      const parsed = existing ? (JSON.parse(existing) as Array<Record<string, string>>) : [];
      parsed.unshift({
        id: payload.id || `guest-${Date.now()}`,
        url: payload.url || trimmedUrl,
        title: payload.title || fallbackTitle,
        summary: payload.summary || 'Saved locally because database permissions are not ready yet.',
        tag: payload.tag || 'other',
        platform: payload.platform || parsedUrl.hostname.replace(/^www\./, ''),
        created_at: payload.created_at || new Date().toISOString(),
      });
      window.localStorage.setItem('stash-guest-links', JSON.stringify(parsed));
    }

    window.dispatchEvent(new CustomEvent('stash:link-saved'));
    setCreateUrl('');
    setIsCreateOpen(false);
    setIsCreating(false);
  }

  async function handleFeedbackSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedbackError('');

    const message = feedbackText.trim();
    if (!message) {
      setFeedbackError('Write your feedback before sending.');
      return;
    }

    setIsSubmittingFeedback(true);
    window.localStorage.setItem(
      'stash-feedback-submissions',
      JSON.stringify([
        {
          id: `feedback-${Date.now()}`,
          message,
          created_at: new Date().toISOString(),
        },
        ...((JSON.parse(window.localStorage.getItem('stash-feedback-submissions') || '[]') as Array<Record<string, string>>) || []),
      ]),
    );

    setFeedbackText('');
    setIsSubmittingFeedback(false);
    setIsFeedbackOpen(false);
  }

  return (
    <div className="stash-app-shell" data-collapsed={collapsed ? 'true' : 'false'}>
      <section className="stash-left-column" aria-label="Brand and primary sidebar">
        <div className="stash-brand-row stash-sidebar-brand-row">
          <div className="stash-brand-mark" />
          <div className="stash-brand-copy">
            <p className="stash-brand-title">STASH</p>
            <p className="stash-brand-subtitle">Knowledge cockpit</p>
          </div>
        </div>

        <aside className="stash-sidebar" aria-label="Primary sidebar">

        <button
          type="button"
          className="stash-sidebar-toggle"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span aria-hidden className="stash-sidebar-toggle-icon" />
        </button>

        <button
          type="button"
          className="stash-create-cta"
          onClick={() => {
            setIsCreateOpen((value) => !value);
            setCreateError('');
          }}
          aria-expanded={isCreateOpen}
        >
          <span className="stash-create-plus">+</span>
          <span className="stash-create-label">{collapsed ? '' : 'Create'}</span>
        </button>

        <nav className="stash-nav">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`stash-nav-link ${active ? 'stash-nav-link-active' : ''}`}
              >
                <span aria-hidden className="stash-nav-icon">
                  {item.icon}
                </span>
                <span className="stash-nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className="stash-nav-link stash-feedback-link"
          onClick={() => {
            setIsFeedbackOpen(true);
            setFeedbackError('');
          }}
        >
          <span aria-hidden className="stash-nav-icon">✎</span>
          <span className="stash-nav-label">Feedback</span>
        </button>

          <Link href="/account" className={`stash-mode-card stash-account-card ${pathname.startsWith('/account') ? 'stash-nav-link-active' : ''}`}>
            <p className="stash-mode-value stash-settings-value">
              <span aria-hidden className="stash-settings-icon">⚙</span>
              <span>Settings</span>
            </p>
          </Link>
        </aside>
      </section>

      <section className="stash-content-column">
        <section className="stash-search-shell">
          <section className="stash-search-header">
            <button type="button" className="stash-search-round" onClick={() => router.push('/home')} aria-label="Go to My Stash">
              ⌂
            </button>

            <div
              className={`stash-search-input-shell ${searchFocused ? 'stash-search-input-shell-focused' : ''} ${searchHovered ? 'stash-search-input-shell-hovered' : ''}`}
              onMouseEnter={() => setSearchHovered(true)}
              onMouseLeave={() => setSearchHovered(false)}
            >
              <span className="stash-search-prefix">⌕</span>
              <input
                ref={searchInputRef}
                className="stash-search-top-input"
                placeholder="What do you want to find?"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 120)}
              />
              <span className="stash-search-shortcut">⌘K</span>

              {searchFocused ? (
                <div className="stash-search-dropdown" role="listbox" aria-label="Recent or suggested searches">
                  {suggestionsLoading ? <p className="stash-search-note">Loading suggestions...</p> : null}
                  {!suggestionsLoading && suggestionsError ? (
                    <p className="stash-search-note">Could not load suggestions: {suggestionsError}</p>
                  ) : null}
                  {!suggestionsLoading && !suggestionsError ? (
                    <>
                      <p className="stash-search-dropdown-title">
                        {searchQuery.trim() ? 'Search results' : 'Recent and suggested'}
                      </p>
                      {dropdownItems.length === 0 ? (
                        <p className="stash-search-note">No suggestions yet. Save more links and they will appear here.</p>
                      ) : (
                        <ul className="stash-search-dropdown-list">
                          {dropdownItems.map((item) => (
                            <li key={item.id}>
                              <button
                                type="button"
                                className="stash-search-dropdown-item"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => void handleSuggestionOpen(item.id)}
                                disabled={activeSuggestionId === item.id}
                              >
                                <strong>{item.title}</strong>
                                <span>{item.platform || 'unknown source'} • {item.monthLabel}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              className="stash-search-round stash-archive-round"
              onClick={() => router.push('/archive/browse-all')}
              aria-label="Browse all archive categories"
            >
              <span aria-hidden className="stash-archive-icon" />
            </button>
          </section>

          {searchActionError ? <p className="stash-search-note" style={{ padding: '0 0.45rem' }}>{searchActionError}</p> : null}
        </section>

        <section className="stash-main">
          <div className="stash-main-scroll">
            <div className="stash-main-inner">

              <header className="stash-screen-head">
                <div>
                  <h1 className="stash-screen-title">{title}</h1>
                  <p className="stash-screen-subtitle">Progressive IA screens for Stash MVP.</p>
                </div>
                <span className="stash-chip">MVP</span>
              </header>
              {children}
            </div>
          </div>
        </section>
      </section>

      {isCreateOpen ? (
        <div className="stash-modal-overlay" onClick={() => setIsCreateOpen(false)} role="presentation">
          <section
            className="stash-create-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Quick create"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Quick Create</h2>
            <p>Paste a link to save it from anywhere in the app.</p>
            <form className="stash-create-form" onSubmit={handleCreateSubmit}>
              <input
                className="stash-inline-input"
                placeholder="https://example.com/article"
                value={createUrl}
                onChange={(event) => setCreateUrl(event.target.value)}
                autoFocus
              />
              <div className="stash-create-actions">
                <button type="submit" disabled={isCreating}>
                  {isCreating ? 'Saving...' : 'Save link'}
                </button>
                <button type="button" className="stash-account-secondary" onClick={() => setIsCreateOpen(false)}>
                  Close
                </button>
              </div>
            </form>
            {createError ? <p className="stash-search-note">{createError}</p> : null}
          </section>
        </div>
      ) : null}

      {isFeedbackOpen ? (
        <div className="stash-modal-overlay" onClick={() => setIsFeedbackOpen(false)} role="presentation">
          <section
            className="stash-create-modal stash-feedback-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Share feedback"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Share feedback</h2>
            <p>Share bugs, feature requests, or anything else.</p>
            <form className="stash-create-form" onSubmit={handleFeedbackSubmit}>
              <textarea
                className="stash-feedback-input"
                placeholder="Write your feedback..."
                value={feedbackText}
                onChange={(event) => setFeedbackText(event.target.value)}
                rows={4}
                autoFocus
              />
              <div className="stash-create-actions">
                <button type="submit" disabled={isSubmittingFeedback}>
                  {isSubmittingFeedback ? 'Sending...' : 'Send'}
                </button>
                <button type="button" className="stash-account-secondary" onClick={() => setIsFeedbackOpen(false)}>
                  Close
                </button>
              </div>
            </form>
            {feedbackError ? <p className="stash-search-note">{feedbackError}</p> : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}
