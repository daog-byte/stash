'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

type AccountTab = 'integrations' | 'preferences' | 'import-export' | 'account';

interface AccountSummary {
  email: string;
  totalLinks: number;
  archivedLinks: number;
  oldestUnreadMonths: number;
  topTopic: string;
}

export default function AccountPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AccountTab>('account');
  const [weeklyDigestOptIn, setWeeklyDigestOptIn] = useState(false);
  const [digestDay, setDigestDay] = useState('monday');
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [summary, setSummary] = useState<AccountSummary>({
    email: 'Loading...',
    totalLinks: 0,
    archivedLinks: 0,
    oldestUnreadMonths: 0,
    topTopic: 'Uncategorized',
  });
  const [status, setStatus] = useState('');
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    async function loadAccount() {
      setStatus('');
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setSummary({
          email: 'Not signed in',
          totalLinks: 0,
          archivedLinks: 0,
          oldestUnreadMonths: 0,
          topTopic: 'Uncategorized',
        });
        setStatus(userError?.message || 'Sign in to view account details.');
        return;
      }

      const metadata = user.user_metadata || {};
      const weeklyDigestFromMetadata = metadata.weekly_digest_opt_in ?? metadata.marketing_opt_in ?? false;
      setWeeklyDigestOptIn(Boolean(weeklyDigestFromMetadata));
      setDigestDay(String(metadata.digest_day || 'monday'));

      let query = await supabase.from('links').select('id,read,tag,saved_at,created_at').eq('user_id', user.id);
      if (query.error && query.error.message.includes('user_id')) {
        query = await supabase.from('links').select('id,read,tag,saved_at,created_at');
      }
      if (query.error && query.error.message.includes('read')) {
        query = await supabase.from('links').select('id,tag,saved_at,created_at');
      }

      const { data, error: linksError } = query;
      if (linksError) {
        setSummary({
          email: user.email || 'Unknown email',
          totalLinks: 0,
          archivedLinks: 0,
          oldestUnreadMonths: 0,
          topTopic: 'Uncategorized',
        });
        setStatus(linksError.message);
        return;
      }

      const rows = data || [];
      const totalLinks = rows.length;
      const archivedLinks = rows.filter((item) => Boolean(item.read)).length;
      const unreadRows = rows.filter((item) => !Boolean(item.read));

      let oldestUnreadMonths = 0;
      unreadRows.forEach((item) => {
        const date = new Date(String(item.saved_at || item.created_at || new Date().toISOString()));
        if (Number.isNaN(date.getTime())) return;

        const months = Math.max(
          0,
          (new Date().getFullYear() - date.getFullYear()) * 12 + (new Date().getMonth() - date.getMonth()),
        );
        oldestUnreadMonths = Math.max(oldestUnreadMonths, months);
      });

      const topicCounts = new Map<string, number>();
      rows.forEach((item) => {
        const key = String(item.tag || 'Uncategorized');
        topicCounts.set(key, (topicCounts.get(key) || 0) + 1);
      });
      const topTopic = Array.from(topicCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Uncategorized';

      setSummary({
        email: user.email || 'Unknown email',
        totalLinks,
        archivedLinks,
        oldestUnreadMonths,
        topTopic,
      });
    }

    void loadAccount();
  }, []);

  const activeCount = useMemo(() => Math.max(0, summary.totalLinks - summary.archivedLinks), [summary]);
  const readThisMonth = useMemo(() => Math.max(0, Math.floor(summary.archivedLinks / 2)), [summary.archivedLinks]);

  async function handleSignOut() {
    setIsSigningOut(true);
    setStatus('');
    const { error } = await supabase.auth.signOut();

    if (error) {
      setStatus(error.message);
      setIsSigningOut(false);
      return;
    }

    router.push('/login');
    router.refresh();
  }

  async function handleSavePreferences() {
    setStatus('');
    setIsSavingPreferences(true);

    const { error } = await supabase.auth.updateUser({
      data: {
        weekly_digest_opt_in: weeklyDigestOptIn,
        digest_day: digestDay,
        marketing_opt_in: weeklyDigestOptIn,
      },
    });

    if (error) {
      setStatus(error.message);
      setIsSavingPreferences(false);
      return;
    }

    setStatus('Preferences saved.');
    setIsSavingPreferences(false);
  }

  return (
    <section className="stash-account-panel">
      <div className="stash-account-head">
        <h2 className="stash-account-title">Settings</h2>
      </div>

      <div className="stash-account-tabs" role="tablist" aria-label="Account settings tabs">
        <button
          type="button"
          className={`stash-account-tab ${activeTab === 'integrations' ? 'stash-account-tab-active' : ''}`}
          onClick={() => setActiveTab('integrations')}
        >
          Integrations
        </button>
        <button
          type="button"
          className={`stash-account-tab ${activeTab === 'preferences' ? 'stash-account-tab-active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          Preferences
        </button>
        <button
          type="button"
          className={`stash-account-tab ${activeTab === 'import-export' ? 'stash-account-tab-active' : ''}`}
          onClick={() => setActiveTab('import-export')}
        >
          Import + Export
        </button>
        <button
          type="button"
          className={`stash-account-tab ${activeTab === 'account' ? 'stash-account-tab-active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          Account
        </button>
      </div>

      {activeTab === 'account' ? (
        <>
          <div className="stash-account-upgrade">
            <div className="stash-account-upgrade-badge">+</div>
            <div>
              <h3>Upgrade to Plus for $3/mo</h3>
              <p>Get AI summaries, transcript support, color themes, and more enrichment credits each month.</p>
              <div className="stash-account-upgrade-actions">
                <button type="button">Upgrade</button>
                <button type="button" className="stash-account-secondary">Learn more</button>
              </div>
            </div>
          </div>

          <div className="stash-account-rows">
            <div className="stash-account-row">
              <div>
                <strong>Email</strong>
                <p>The email address for your account</p>
              </div>
              <span>{summary.email}</span>
            </div>
            <div className="stash-account-row">
              <div>
                <strong>Total saved</strong>
                <p>Your library at a glance</p>
              </div>
              <span>{summary.totalLinks} links</span>
            </div>
            <div className="stash-account-row">
              <div>
                <strong>Read this month</strong>
                <p>Current monthly pace</p>
              </div>
              <span>{readThisMonth} links</span>
            </div>
            <div className="stash-account-row">
              <div>
                <strong>Oldest unread save</strong>
                <p>Use tidy-up to clear backlog</p>
              </div>
              <span>{summary.oldestUnreadMonths} months ago</span>
            </div>
            <div className="stash-account-row">
              <div>
                <strong>Top topic</strong>
                <p>Auto-clustered from your saves</p>
              </div>
              <span>{summary.topTopic}</span>
            </div>
            <div className="stash-account-row">
              <div>
                <strong>Sign out</strong>
                <p>Sign out of your account on this device</p>
              </div>
              <button type="button" className="stash-account-action" onClick={() => void handleSignOut()} disabled={isSigningOut}>
                {isSigningOut ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          </div>
        </>
      ) : null}

      {activeTab === 'integrations' ? (
        <div className="stash-account-rows">
          <div className="stash-account-row">
            <div>
              <strong>X (Twitter)</strong>
              <p>Last synced recently • bookmarks imported</p>
            </div>
            <button type="button" className="stash-account-action" disabled>
              Connected
            </button>
          </div>
          <div className="stash-account-row">
            <div>
              <strong>LinkedIn</strong>
              <p>Sync your saved posts</p>
            </div>
            <button type="button" className="stash-account-secondary" disabled>
              Connect
            </button>
          </div>
          <div className="stash-account-row">
            <div>
              <strong>Instagram</strong>
              <p>Sync your saved posts</p>
            </div>
            <button type="button" className="stash-account-secondary" disabled>
              Connect
            </button>
          </div>
          <div className="stash-account-row">
            <div>
              <strong>iOS Shortcut</strong>
              <p>Share any link to STASH from any app</p>
            </div>
            <button type="button" className="stash-account-secondary" disabled>
              Download
            </button>
          </div>
        </div>
      ) : null}

      {activeTab === 'preferences' ? (
        <div className="stash-account-rows">
          <div className="stash-account-row">
            <div>
              <strong>Weekly digest email</strong>
              <p>Send me a weekly digest of my saved posts via email</p>
            </div>
            <label className="stash-inline-check">
              <input
                type="checkbox"
                checked={weeklyDigestOptIn}
                onChange={(event) => setWeeklyDigestOptIn(event.target.checked)}
              />
              <span>{weeklyDigestOptIn ? 'On' : 'Off'}</span>
            </label>
          </div>
          <div className="stash-account-row">
            <div>
              <strong>Digest day</strong>
              <p>Best day to send</p>
            </div>
            <select value={digestDay} onChange={(event) => setDigestDay(event.target.value)}>
              <option value="monday">Monday</option>
              <option value="tuesday">Tuesday</option>
              <option value="wednesday">Wednesday</option>
              <option value="thursday">Thursday</option>
              <option value="friday">Friday</option>
              <option value="saturday">Saturday</option>
              <option value="sunday">Sunday</option>
            </select>
          </div>
          <div className="stash-account-row">
            <div>
              <strong>Links per digest</strong>
              <p>How many picks per issue</p>
            </div>
            <span>5 links</span>
          </div>
          <div className="stash-account-row">
            <div>
              <strong>Tidy-up threshold</strong>
              <p>When unread links are flagged as stale</p>
            </div>
            <span>90 days</span>
          </div>
          <div className="stash-account-row">
            <div>
              <strong>Default sort</strong>
              <p>Initial ordering for My Stash</p>
            </div>
            <span>Priority first</span>
          </div>
          <div className="stash-account-row">
            <div>
              <strong>Save preferences</strong>
              <p>Apply your digest settings</p>
            </div>
            <button type="button" className="stash-account-action" onClick={() => void handleSavePreferences()} disabled={isSavingPreferences}>
              {isSavingPreferences ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : null}

      {activeTab === 'import-export' ? (
        <div className="stash-account-rows">
          <div className="stash-account-row">
            <div>
              <strong>Export all links</strong>
              <p>Download as CSV or JSON</p>
            </div>
            <button type="button" className="stash-account-secondary" disabled>
              Export
            </button>
          </div>
          <div className="stash-account-row">
            <div>
              <strong>Import links</strong>
              <p>From CSV, Pocket export, or Safari reading list</p>
            </div>
            <button type="button" className="stash-account-secondary" disabled>
              Import
            </button>
          </div>
          <div className="stash-account-row">
            <div>
              <strong>Sign out</strong>
              <p>Sign out of your account on this device</p>
            </div>
            <button type="button" className="stash-account-action" onClick={() => void handleSignOut()} disabled={isSigningOut}>
              {isSigningOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
          <div className="stash-account-row">
            <div>
              <strong>Delete account</strong>
              <p>Permanently remove account and saved links</p>
            </div>
            <button type="button" className="stash-account-danger" disabled>
              Delete
            </button>
          </div>
        </div>
      ) : null}

      {status ? <p className="stash-search-note">{status}</p> : null}
      <p className="stash-account-footnote">Current active links: {activeCount}</p>
    </section>
  );
}
