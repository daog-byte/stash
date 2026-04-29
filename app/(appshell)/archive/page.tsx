'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';

interface ArchivedLink {
  id: string;
  title: string;
  platform: string | null;
  savedAt: string;
}

function formatSavedDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export default function ArchivePage() {
  const [links, setLinks] = useState<ArchivedLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadArchive() {
      setIsLoading(true);
      setError('');

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setError(userError.message);
        setIsLoading(false);
        return;
      }

      if (!user) {
        setLinks([]);
        setIsLoading(false);
        return;
      }

      let query = await supabase
        .from('links')
        .select('id,title,url,platform,saved_at,created_at,read')
        .eq('user_id', user.id)
        .eq('read', true)
        .order('saved_at', { ascending: false });

      if (query.error && query.error.message.includes('user_id')) {
        query = await supabase
          .from('links')
          .select('id,title,url,platform,saved_at,created_at,read')
          .eq('read', true)
          .order('saved_at', { ascending: false });
      }

      if (query.error && query.error.message.includes('read')) {
        query = await supabase
          .from('links')
          .select('id,title,url,platform,saved_at,created_at')
          .order('saved_at', { ascending: false });
      }

      const { data, error: queryError } = query;

      if (queryError) {
        setError(queryError.message);
        setIsLoading(false);
        return;
      }

      const mapped = (data || []).map((row) => ({
        id: String(row.id || ''),
        title: String(row.title || row.url || 'Untitled save'),
        platform: row.platform ? String(row.platform) : null,
        savedAt: String(row.saved_at || row.created_at || new Date().toISOString()),
      }));

      setLinks(mapped);
      setIsLoading(false);
    }

    void loadArchive();
  }, []);

  return (
    <>
      <section className="stash-card">
        <h3>Read Archive</h3>
        <p style={{ marginTop: 10, color: '#6a6158' }}>
          Links move here after they are marked as read from search suggestions or detail actions.
        </p>
      </section>

      <section className="stash-home-feed">
        {isLoading ? <article className="stash-card">Loading archive...</article> : null}
        {!isLoading && error ? <article className="stash-card">Could not load archive: {error}</article> : null}
        {!isLoading && !error && links.length === 0 ? (
          <article className="stash-card">No archived links yet. Open a suggestion from Search to archive your first item.</article>
        ) : null}

        {!isLoading && !error
          ? links.map((link) => (
              <article key={link.id} className="stash-card stash-home-link-card">
                <div className="stash-home-link-head">
                  <span className="stash-home-priority">archived</span>
                  <span className="stash-home-days">Saved {formatSavedDate(link.savedAt)}</span>
                </div>
                <h4>{link.title}</h4>
                <div className="stash-home-meta">
                  <span>{link.platform || 'unknown source'}</span>
                </div>
                <div className="stash-home-actions">
                  <Link href={`/link/${link.id}`}>Open detail</Link>
                </div>
              </article>
            ))
          : null}
      </section>
    </>
  );
}