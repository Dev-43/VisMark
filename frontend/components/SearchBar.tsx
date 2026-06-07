'use client';

import { useSearch } from '@/lib/useSearch';
import { useState, useRef, useEffect } from 'react';

export default function SearchBar() {
  const { query, setQuery, results, isLoading, error } = useSearch();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsOpen(query.trim().length > 0);
  }, [query]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Input row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #ccc', borderRadius: '8px', padding: '8px 12px', background: '#fff' }}>
        <span style={{ color: '#999' }}>🔍</span>
        <input
          type="text"
          placeholder="Search your links..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', background: 'transparent' }}
        />
        {isLoading && <span style={{ fontSize: '12px', color: '#999' }}>searching...</span>}
        {query && !isLoading && (
          <button onClick={() => setQuery('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#999', fontSize: '16px' }}>✕</button>
        )}
      </div>

      {/* Dropdown results */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          marginTop: '4px',
          width: '100%',
          background: '#fff',
          border: '1px solid #ccc',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 50,
          maxHeight: '360px',
          overflowY: 'auto'
        }}>
          {error && <p style={{ padding: '12px', color: 'red', fontSize: '14px' }}>{error}</p>}

          {!error && results.length === 0 && !isLoading && (
            <p style={{ padding: '12px', color: '#999', fontSize: '14px' }}>{`No results for "${query}"`}</p>
          )}

          {results.map((result) => (
            <a
              key={result.id}
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', borderBottom: '1px solid #f0f0f0', textDecoration: 'none', color: 'inherit' }}
            >
              {result.favicon_url
                ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={result.favicon_url} alt="" style={{ width: '16px', height: '16px', marginTop: '2px', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '16px', height: '16px', marginTop: '2px', borderRadius: '4px', background: '#eee', flexShrink: 0 }} />
                )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {result.title || result.url}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#999', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {result.url}
                </p>
                {result.folders && (
                  <span style={{ fontSize: '11px', color: '#4f8ef7', marginTop: '2px', display: 'inline-block' }}>
                    📁 {result.folders.name}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}