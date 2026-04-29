'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/app/lib/supabase';

interface BrowseLink {
  id: string;
  title: string;
  summary: string;
  platform: string | null;
  tag: string | null;
  priority: string | null;
  savedAt: string;
}

interface CategoryBucket {
  name: string;
  links: BrowseLink[];
}

function inferCategory(link: BrowseLink) {
  const text = `${link.title} ${link.summary} ${link.tag || ''} ${link.platform || ''}`.toLowerCase();

  if (/ai|llm|machine learning|gpt|agent/.test(text)) return 'AI and Automation';
  if (/design|ux|ui|figma|visual/.test(text)) return 'Design and Product';
  if (/startup|business|growth|marketing|sales/.test(text)) return 'Business and Growth';
  if (/code|typescript|javascript|python|engineering|api/.test(text)) return 'Engineering';
  if (/finance|money|invest|crypto|economy/.test(text)) return 'Finance';
  if (/health|wellness|fitness|nutrition/.test(text)) return 'Health';
  if (/news|politics|world|media/.test(text)) return 'News and Culture';
  return 'General Knowledge';
}

export default function ArchiveBrowseAllPage() {
  const [links, setLinks] = useState<BrowseLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadLinks() {
      setIsLoading(true);
      setError('');

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError(userError?.message || 'Sign in to browse archive categories.');
        setIsLoading(false);
        return;
      }

      let query = await supabase
        .from('links')
        .select('id,title,url,summary,platform,tag,priority,saved_at,created_at,read')
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });

      if (query.error && query.error.message.includes('user_id')) {
        query = await supabase
          .from('links')
          .select('id,title,url,summary,platform,tag,priority,saved_at,created_at,read')
          .order('saved_at', { ascending: false });
      }

      if (query.error) {
        setError(query.error.message);
        setIsLoading(false);
        return;
      }

      const mapped = (query.data || [])
        .filter((row) => !row.read)
        .map((row) => ({
          id: String(row.id || ''),
          title: String(row.title || row.url || 'Untitled save'),
          summary: String(row.summary || 'No summary yet.'),
          platform: row.platform ? String(row.platform) : null,
          tag: row.tag ? String(row.tag) : null,
          priority: row.priority ? String(row.priority) : null,
          savedAt: String(row.saved_at || row.created_at || new Date().toISOString()),
        }));

      setLinks(mapped);
      setIsLoading(false);
    }

    void loadLinks();
  }, []);

  const buckets = useMemo(() => {
    const map = new Map<string, BrowseLink[]>();

    links.forEach((link) => {
      const category = inferCategory(link);
      map.set(category, [...(map.get(category) || []), link]);
    });

    return Array.from(map.entries())
      .map(([name, categoryLinks]) => ({ name, links: categoryLinks.slice(0, 6) }))
      .sort((a, b) => b.links.length - a.links.length) as CategoryBucket[];
  }, [links]);

  return (
    <>
      <section className="stash-card">
        <h3>Browse all</h3>
        <p style={{ marginTop: 10, color: '#6a6158' }}>
          Intelligent category sections from your saved links so you can jump by theme, not just by date.
        </p>
      </section>

      {isLoading ? <section className="stash-card">Loading categories...</section> : null}
      {!isLoading && error ? <section className="stash-card">Could not load categories: {error}</section> : null}

      {!isLoading && !error && buckets.length === 0 ? (
        <section className="stash-card">No links yet. Save a few links and categories will appear here.</section>
      ) : null}

      {!isLoading && !error && buckets.length > 0 ? (
        <section className="stash-browse-grid">
          {buckets.map((bucket) => (
            <article key={bucket.name} className="stash-browse-card">
              <h3>{bucket.name}</h3>
              <ul className="stash-list">
                {bucket.links.map((link) => (
                  <li key={link.id}>
                    <Link href={`/link/${link.id}`} className="stash-browse-link">
                      <strong>{link.title}</strong>
                      <span>{link.platform || 'unknown source'}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      ) : null}
    </>
  );
}
