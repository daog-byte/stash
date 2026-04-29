'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/app/lib/supabase';

type HomeTab = 'today' | 'all' | 'topic';
type HomeStatusFilter = 'all' | 'urgent' | 'pending' | 'archived';
type HomeSort = 'newest' | 'oldest' | 'priority';

interface SavedLink {
  id: string;
  url: string;
  title: string;
  summary: string;
  tag: string | null;
  priority: string | null;
  platform: string | null;
  savedAt: string;
  read: boolean;
}

function toDaysAgo(savedAt: string) {
  const saved = new Date(savedAt).getTime();
  const diffMs = Date.now() - saved;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function classifyStatus(link: SavedLink): HomeStatusFilter {
  const priority = (link.priority || '').toLowerCase();
  if (link.read) return 'archived';
  if (priority.includes('urgent') || priority.includes('high') || priority === 'p1') return 'urgent';
  return 'pending';
}

function priorityWeight(priority: string | null) {
  const value = (priority || '').toLowerCase();
  if (value.includes('urgent') || value.includes('high') || value === 'p1') return 3;
  if (value.includes('medium') || value === 'p2') return 2;
  return 1;
}

export default function HomeScreen() {
  const [links, setLinks] = useState<SavedLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<HomeTab>('today');
  const [statusFilter, setStatusFilter] = useState<HomeStatusFilter>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<HomeSort>('newest');
  const [laterIds, setLaterIds] = useState<Set<string>>(new Set());

  const loadLinks = useCallback(async () => {
    setIsLoading(true);
    setError('');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let mapped: SavedLink[] = [];

    if (user) {
      let query = await supabase.from('links').select('*').eq('user_id', user.id);
      if (query.error && query.error.message.includes('user_id')) {
        query = await supabase.from('links').select('*');
      }

      const { data, error: queryError } = query;

      if (queryError) {
        setError(queryError.message);
        setIsLoading(false);
        return;
      }

      mapped = (data || []).map((row: Record<string, unknown>) => ({
        id: String(row.id || ''),
        url: String(row.url || ''),
        title: String(row.title || row.url || 'Untitled save'),
        summary: String(row.summary || 'No summary yet.'),
        tag: row.tag ? String(row.tag) : null,
        priority: row.priority ? String(row.priority) : null,
        platform: row.platform ? String(row.platform) : null,
        savedAt: String(row.saved_at || row.created_at || new Date().toISOString()),
        read: Boolean(row.read),
      }));
    }

    const existing = window.localStorage.getItem('stash-guest-links');
    const guestRows = existing ? (JSON.parse(existing) as Array<Record<string, unknown>>) : [];
    const guestMapped = guestRows.map((row) => ({
      id: String(row.id || ''),
      url: String(row.url || ''),
      title: String(row.title || row.url || 'Untitled save'),
      summary: String(row.summary || 'No summary yet.'),
      tag: row.tag ? String(row.tag) : null,
      priority: null,
      platform: row.platform ? String(row.platform) : null,
      savedAt: String(row.created_at || new Date().toISOString()),
      read: false,
    }));

    setLinks([...guestMapped, ...mapped]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadLinks();
  }, [loadLinks]);

  useEffect(() => {
    const refreshOnSave = () => {
      void loadLinks();
    };

    window.addEventListener('stash:link-saved', refreshOnSave);
    return () => {
      window.removeEventListener('stash:link-saved', refreshOnSave);
    };
  }, [loadLinks]);

  const isMonday = useMemo(() => new Date().getDay() === 1, []);

  const topicCounts = useMemo(() => {
    const counts = new Map<string, number>();
    links.forEach((link) => {
      const key = link.tag || 'untagged';
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [links]);

  const topicOptions = useMemo(() => {
    return ['all', ...Array.from(topicCounts.keys())];
  }, [topicCounts]);

  const platformOptions = useMemo(() => {
    const unique = Array.from(new Set(links.map((link) => link.platform || 'unknown')));
    return ['all', ...unique];
  }, [links]);

  const staleCount = useMemo(() => {
    return links.filter((link) => toDaysAgo(link.savedAt) >= 90 && !link.read).length;
  }, [links]);

  const filtered = useMemo(() => {
    let result = [...links];

    if (activeTab === 'today') {
      result = result.filter((link) => toDaysAgo(link.savedAt) <= 1);
    }

    if (activeTab === 'topic' && platformFilter !== 'all') {
      result = result.filter((link) => (link.tag || 'untagged') === platformFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter((link) => classifyStatus(link) === statusFilter);
    }

    if (platformFilter !== 'all' && activeTab !== 'topic') {
      result = result.filter((link) => (link.platform || 'unknown') === platformFilter);
    }

    if (sortBy === 'newest') {
      result.sort((a, b) => +new Date(b.savedAt) - +new Date(a.savedAt));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => +new Date(a.savedAt) - +new Date(b.savedAt));
    } else {
      result.sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority));
    }

    return result;
  }, [activeTab, links, platformFilter, sortBy, statusFilter]);

  const curatedFeed = filtered.slice(0, 5);

  return (
    <>
      <section className="stash-bento">
        <article className="stash-card">
          <h3>Weekly Digest</h3>
          <div className="stash-home-banner" data-active={isMonday ? 'true' : 'false'}>
            {isMonday
              ? 'Monday digest is live: 5 fresh picks based on your latest saves.'
              : 'Digest preview: Your Monday pick list appears here each week.'}
          </div>
          <div className="stash-home-tabs" role="tablist" aria-label="Home tabs">
            <button type="button" onClick={() => setActiveTab('today')} data-active={activeTab === 'today'}>
              Today
            </button>
            <button type="button" onClick={() => setActiveTab('all')} data-active={activeTab === 'all'}>
              All saved
            </button>
            <button type="button" onClick={() => setActiveTab('topic')} data-active={activeTab === 'topic'}>
              By topic
            </button>
          </div>
          {staleCount > 0 ? (
            <p className="stash-home-nudge">
              Tidy up nudge: {staleCount} unread items are 90+ days old. <Link href="/tidy">Review now</Link>
            </p>
          ) : null}
        </article>

        <article className="stash-card">
          <h3>Feed Options</h3>
          <div className="stash-home-controls">
            <label>
              Status
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as HomeStatusFilter)}>
                <option value="all">All</option>
                <option value="urgent">Urgent</option>
                <option value="pending">Pending</option>
                <option value="archived">Archived</option>
              </select>
            </label>

            <label>
              Platform
              <select value={platformFilter} onChange={(event) => setPlatformFilter(event.target.value)}>
                {platformOptions.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Sort
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as HomeSort)}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="priority">Priority</option>
              </select>
            </label>

            {activeTab === 'topic' ? (
              <label>
                Topic
                <select value={platformFilter} onChange={(event) => setPlatformFilter(event.target.value)}>
                  {topicOptions.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
        </article>
      </section>

      <section className="stash-home-feed">
        {isLoading ? <article className="stash-card">Loading your saved links...</article> : null}
        {!isLoading && error ? <article className="stash-card">Could not load links: {error}</article> : null}
        {!isLoading && !error && curatedFeed.length === 0 ? (
          <article className="stash-card">No links match this view yet. Save a few links and they will appear here.</article>
        ) : null}

        {!isLoading && !error
          ? curatedFeed.map((link) => (
              <article key={link.id} className="stash-card stash-home-link-card">
                <div className="stash-home-link-head">
                  <span className="stash-home-priority">{link.priority || 'normal'}</span>
                  <span className="stash-home-days">Saved {toDaysAgo(link.savedAt)} day(s) ago</span>
                </div>

                <h4>{link.title}</h4>
                <p>{link.summary}</p>

                <div className="stash-home-meta">
                  <span>{link.platform || 'unknown'}</span>
                  <span>{link.tag || 'untagged'}</span>
                </div>

                <div className="stash-home-actions">
                  <Link href={`/link/${link.id}`}>Read</Link>
                  <button
                    type="button"
                    onClick={() =>
                      setLaterIds((previous) => {
                        const next = new Set(previous);
                        if (next.has(link.id)) {
                          next.delete(link.id);
                        } else {
                          next.add(link.id);
                        }
                        return next;
                      })
                    }
                  >
                    {laterIds.has(link.id) ? 'Added to later' : 'Later'}
                  </button>
                  <Link
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="stash-open-tab-link"
                    aria-label="Open in new tab"
                    title="Open in new tab"
                  >
                    <span aria-hidden className="stash-open-tab-icon" />
                  </Link>
                </div>
              </article>
            ))
          : null}
      </section>
    </>
  );
}
