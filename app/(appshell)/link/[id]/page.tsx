'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

interface DetailLink {
  id: string;
  title: string;
  url: string;
  summary: string;
  tag: string | null;
  priority: string | null;
  platform: string | null;
  savedAt: string;
  read: boolean;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export default function LinkDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [link, setLink] = useState<DetailLink | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [shuffleError, setShuffleError] = useState('');

  const linkId = String(params.id || '');

  useEffect(() => {
    async function loadLink() {
      setIsLoading(true);
      setError('');

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError(userError?.message || 'You must be logged in to view this link.');
        setIsLoading(false);
        return;
      }

      let query = await supabase
        .from('links')
        .select('*')
        .eq('id', linkId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (query.error && query.error.message.includes('user_id')) {
        query = await supabase.from('links').select('*').eq('id', linkId).maybeSingle();
      }

      const { data, error: queryError } = query;

      if (queryError) {
        setError(queryError.message);
        setIsLoading(false);
        return;
      }

      if (!data) {
        setError('Link not found in your account.');
        setIsLoading(false);
        return;
      }

      setLink({
        id: String(data.id || ''),
        title: String(data.title || data.url || 'Untitled save'),
        url: String(data.url || ''),
        summary: String(data.summary || 'No summary available yet.'),
        tag: data.tag ? String(data.tag) : null,
        priority: data.priority ? String(data.priority) : null,
        platform: data.platform ? String(data.platform) : null,
        savedAt: String(data.saved_at || data.created_at || new Date().toISOString()),
        read: Boolean(data.read),
      });
      setIsLoading(false);
    }

    if (linkId) {
      void loadLink();
    }
  }, [linkId]);

  const statusLabel = useMemo(() => {
    if (!link) return 'unknown';
    return link.read ? 'archived' : 'active';
  }, [link]);

  async function updateReadState(read: boolean) {
    if (!link) return;
    setIsSaving(true);
    setError('');

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError(userError?.message || 'You must be logged in to update this item.');
      setIsSaving(false);
      return;
    }

    let updateResult = await supabase
      .from('links')
      .update({ read })
      .eq('id', link.id)
      .eq('user_id', user.id);

    if (updateResult.error && updateResult.error.message.includes('user_id')) {
      updateResult = await supabase.from('links').update({ read }).eq('id', link.id);
    }

    const updateError = updateResult.error;

    if (updateError && !updateError.message.includes('read')) {
      setError(updateError.message);
      setIsSaving(false);
      return;
    }

    setLink((previous) => (previous ? { ...previous, read } : previous));
    setIsSaving(false);
  }

  async function handleShuffleNext() {
    if (!link) return;

    setIsSaving(true);
    setShuffleError('');

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setShuffleError(userError?.message || 'You must be logged in to shuffle links.');
      setIsSaving(false);
      return;
    }

    let linksQuery = await supabase
      .from('links')
      .select('id,title,url,priority,saved_at,created_at,read')
      .eq('user_id', user.id);

    if (linksQuery.error && linksQuery.error.message.includes('user_id')) {
      linksQuery = await supabase.from('links').select('id,title,url,priority,saved_at,created_at,read');
    }

    if (linksQuery.error && linksQuery.error.message.includes('read')) {
      linksQuery = await supabase.from('links').select('id,title,url,priority,saved_at,created_at');
    }

    const { data: linksData, error: linksError } = linksQuery;

    if (linksError) {
      setShuffleError(linksError.message);
      setIsSaving(false);
      return;
    }

    const response = await fetch('/api/shuffle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        links: (linksData || []).map((item) => ({
          id: String(item.id || ''),
          title: String(item.title || item.url || 'Untitled save'),
          url: item.url ? String(item.url) : '',
          priority: item.priority ? String(item.priority) : null,
          savedAt: item.saved_at ? String(item.saved_at) : undefined,
          createdAt: item.created_at ? String(item.created_at) : undefined,
          read: Boolean(item.read),
        })),
        excludeIds: [link.id],
        includeRead: false,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setShuffleError(String(payload.error || 'Could not shuffle right now.'));
      setIsSaving(false);
      return;
    }

    if (!payload.selected?.id) {
      setShuffleError('No unread links available to shuffle.');
      setIsSaving(false);
      return;
    }

    router.push(`/link/${payload.selected.id}?via=shuffle`);
  }

  return (
    <>
      <section className="stash-card">
        <h3>Selected Link</h3>
        {isLoading ? <p style={{ marginTop: 10 }}>Loading link details...</p> : null}
        {!isLoading && error ? <p style={{ marginTop: 10 }}>Could not load link: {error}</p> : null}
        {!isLoading && !error && link ? (
          <>
            <h2 className="stash-link-title">{link.title}</h2>
            <p className="stash-link-url">{link.url}</p>
            <p className="stash-link-summary">{link.summary}</p>
            <div className="stash-home-meta">
              <span>{link.platform || 'unknown source'}</span>
              <span>{link.priority || 'normal priority'}</span>
              <span>{link.tag || 'untagged'}</span>
              <span>saved {formatDate(link.savedAt)}</span>
              <span>{statusLabel}</span>
            </div>

            <div className="stash-home-actions" style={{ marginTop: 14 }}>
              <a href={link.url} target="_blank" rel="noreferrer">
                Read full article
              </a>
              <button type="button" onClick={() => void updateReadState(!link.read)} disabled={isSaving}>
                {link.read ? 'Move back to active' : 'Archive'}
              </button>
              <button type="button" onClick={() => void handleShuffleNext()} disabled={isSaving}>
                Shuffle next
              </button>
              <Link href="/archive">Open archive</Link>
            </div>
            {shuffleError ? <p className="stash-search-note">{shuffleError}</p> : null}
          </>
        ) : null}
      </section>

      <section className="stash-grid">
        <article className="stash-card">
          <h3>Shuffle Behavior</h3>
          <ul className="stash-list">
            <li>Pulls from your unread links first</li>
            <li>Uses weighted priority + age scoring</li>
            <li>Excludes the current link to avoid immediate repeats</li>
          </ul>
        </article>
        <article className="stash-card">
          <h3>Commands</h3>
          <ul className="stash-list">
            <li>Read full article in a new tab</li>
            <li>Archive or reactivate current link</li>
            <li>Shuffle to next weighted pick</li>
            <li>
              <Link href="/home">Back to home</Link>
            </li>
          </ul>
        </article>
        <article className="stash-card">
          <h3>Library</h3>
          <ul className="stash-list">
            <li>
              <Link href="/archive">View archived links</Link>
            </li>
            <li>
              <Link href="/search">Return to search</Link>
            </li>
          </ul>
        </article>
      </section>
    </>
  );
}
