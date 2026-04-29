'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/app/lib/supabase';

export interface SearchSuggestion {
  id: string;
  title: string;
  platform: string | null;
  savedAt: string;
  monthKey: string;
  monthLabel: string;
}

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function buildMonthWindow(limit: number) {
  const now = new Date();
  const keys: string[] = [];

  for (let i = 0; i < limit; i += 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(toMonthKey(monthDate));
  }

  return keys;
}

function toSuggestionMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function useSearchSuggestions() {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const monthWindow = useMemo(() => buildMonthWindow(6), []);

  const loadSuggestions = useCallback(async () => {
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
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    let query = await supabase
      .from('links')
      .select('id,title,url,platform,saved_at,created_at,read')
      .eq('user_id', user.id)
      .eq('read', false)
      .order('saved_at', { ascending: false });

    if (query.error && query.error.message.includes('user_id')) {
      query = await supabase
        .from('links')
        .select('id,title,url,platform,saved_at,created_at,read')
        .eq('read', false)
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

    const byMonth = new Map<string, SearchSuggestion>();

    for (const row of data || []) {
      const savedRaw = String(row.saved_at || row.created_at || new Date().toISOString());
      const savedDate = new Date(savedRaw);

      if (Number.isNaN(savedDate.getTime())) {
        continue;
      }

      const monthKey = toMonthKey(savedDate);
      if (!monthWindow.includes(monthKey) || byMonth.has(monthKey)) {
        continue;
      }

      byMonth.set(monthKey, {
        id: String(row.id || ''),
        title: String(row.title || row.url || 'Untitled save'),
        platform: row.platform ? String(row.platform) : null,
        savedAt: savedRaw,
        monthKey,
        monthLabel: toSuggestionMonthLabel(savedDate),
      });
    }

    const nextSuggestions = monthWindow
      .map((monthKey) => byMonth.get(monthKey))
      .filter((item): item is SearchSuggestion => Boolean(item));

    setSuggestions(nextSuggestions);
    setIsLoading(false);
  }, [monthWindow]);

  useEffect(() => {
    void loadSuggestions();
  }, [loadSuggestions]);

  return {
    suggestions,
    isLoading,
    error,
    refreshSuggestions: loadSuggestions,
  };
}