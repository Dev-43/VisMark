import { useState, useEffect } from 'react';
import { createClient } from './supabase';

export interface SearchResult {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  screenshot_url: string | null;
  favicon_url: string | null;
  snapshot_status: string;
  folder_id: string;
  created_at: string;
  folders: { name: string } | null;
}

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If query is empty, clear results and stop
    if (!query.trim()) {
      setResults([]);
      return;
    }

    // Debounce: wait 400ms after user stops typing
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get the current session token
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          setError('Not logged in');
          return;
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/search?q=${encodeURIComponent(query)}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        const json = await res.json();

        if (!res.ok) throw new Error(json.error || 'Search failed');

        setResults(json.results);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Search failed');
        }
      } finally {
        setIsLoading(false);
      }
    }, 400); // 400ms debounce delay

    // Cleanup: if user types again before 400ms, cancel the previous timer
    return () => clearTimeout(timer);
  }, [query]); // re-runs every time query changes

  return { query, setQuery, results, isLoading, error };
}