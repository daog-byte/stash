'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/app/lib/supabase';

interface TopicLink {
  id: string;
  title: string;
  summary: string;
  platform: string | null;
  tag: string | null;
  savedAt: string;
  read: boolean;
}

interface TopicGroup {
  name: string;
  links: TopicLink[];
}

function inferTopic(link: TopicLink) {
  const source = `${link.title} ${link.summary} ${link.tag || ''} ${link.platform || ''}`.toLowerCase();

  if (/ai|llm|gpt|agent|automation/.test(source)) return 'AI and Automation';
  if (/design|ux|ui|figma|product/.test(source)) return 'Design and Product';
  if (/business|growth|startup|marketing|sales/.test(source)) return 'Business and Growth';
  if (/code|typescript|javascript|python|engineering|api/.test(source)) return 'Engineering';
  if (/money|finance|invest|crypto|economy/.test(source)) return 'Finance';
  if (/health|wellness|fitness|mindfulness/.test(source)) return 'Health and Wellness';
  if (/news|culture|politics|media/.test(source)) return 'News and Culture';
  return 'General Knowledge';
}

function formatRelativeAge(savedAt: string) {
  const diff = Date.now() - new Date(savedAt).getTime();
  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  if (days < 1) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}

export default function TopicsPage() {
  const [links, setLinks] = useState<TopicLink[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('');
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
        setError(userError?.message || 'Sign in to view topic clusters.');
        setIsLoading(false);
        return;
      }

      let query = await supabase
        .from('links')
        .select('id,title,url,summary,platform,tag,saved_at,created_at,read')
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });

      if (query.error && query.error.message.includes('user_id')) {
        query = await supabase
          .from('links')
          .select('id,title,url,summary,platform,tag,saved_at,created_at,read')
          .order('saved_at', { ascending: false });
      }

      if (query.error) {
        setError(query.error.message);
        setIsLoading(false);
        return;
      }

      const mapped = (query.data || []).map((row) => ({
        id: String(row.id || ''),
        title: String(row.title || row.url || 'Untitled save'),
        summary: String(row.summary || 'No summary yet.'),
        platform: row.platform ? String(row.platform) : null,
        tag: row.tag ? String(row.tag) : null,
        savedAt: String(row.saved_at || row.created_at || new Date().toISOString()),
        read: Boolean(row.read),
      }));

      setLinks(mapped);
      setIsLoading(false);
    }

    void loadLinks();
  }, []);

  const topicGroups = useMemo(() => {
    const map = new Map<string, TopicLink[]>();

    links.forEach((link) => {
      const topic = inferTopic(link);
      map.set(topic, [...(map.get(topic) || []), link]);
    });

    return Array.from(map.entries())
      .map(([name, groupedLinks]) => ({ name, links: groupedLinks }))
      .sort((a, b) => b.links.length - a.links.length) as TopicGroup[];
  }, [links]);

  useEffect(() => {
    if (!selectedTopic && topicGroups.length > 0) {
      setSelectedTopic(topicGroups[0].name);
    }
  }, [selectedTopic, topicGroups]);

  const currentTopic = topicGroups.find((group) => group.name === selectedTopic) || topicGroups[0];

  return (
    <>
      <section className="stash-bento">
        <article className="stash-card">
          <h3>Topic Clusters</h3>
          {isLoading ? <p style={{ marginTop: 10 }}>Building topic clusters...</p> : null}
          {!isLoading && error ? <p style={{ marginTop: 10 }}>Could not build topics: {error}</p> : null}
          {!isLoading && !error && topicGroups.length === 0 ? (
            <p style={{ marginTop: 10 }}>No saved links yet. Add links in My Stash to generate topic clusters.</p>
          ) : null}
          {!isLoading && !error && topicGroups.length > 0 ? (
            <div className="stash-topic-pills" role="tablist" aria-label="Topic groups">
              {topicGroups.map((group) => (
                <button
                  key={group.name}
                  type="button"
                  className={`stash-topic-pill ${selectedTopic === group.name ? 'stash-topic-pill-active' : ''}`}
                  onClick={() => setSelectedTopic(group.name)}
                >
                  {group.name} ({group.links.length})
                </button>
              ))}
            </div>
          ) : null}
        </article>

        <article className="stash-card">
          <h3>Selected Topic</h3>
          {!currentTopic ? <p style={{ marginTop: 10 }}>Pick a topic to inspect links.</p> : null}
          {currentTopic ? (
            <>
              <p style={{ marginTop: 10, fontWeight: 700 }}>{currentTopic.name}</p>
              <p style={{ color: '#6a6158' }}>
                {currentTopic.links.length} links • newest {formatRelativeAge(currentTopic.links[0].savedAt)}
              </p>
              <p style={{ marginTop: 10, color: '#6a6158' }}>
                Unread links: {currentTopic.links.filter((link) => !link.read).length}
              </p>
            </>
          ) : null}
        </article>
      </section>

      <section className="stash-home-feed">
        {!currentTopic ? <article className="stash-card">No topic selected yet.</article> : null}

        {currentTopic
          ? currentTopic.links.slice(0, 8).map((link) => (
              <article key={link.id} className="stash-card stash-home-link-card">
                <div className="stash-home-link-head">
                  <span className="stash-home-priority">{link.read ? 'archived' : 'active'}</span>
                  <span className="stash-home-days">Saved {formatRelativeAge(link.savedAt)}</span>
                </div>
                <h4>{link.title}</h4>
                <p>{link.summary}</p>
                <div className="stash-home-meta">
                  <span>{link.platform || 'unknown source'}</span>
                  <span>{currentTopic.name}</span>
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
