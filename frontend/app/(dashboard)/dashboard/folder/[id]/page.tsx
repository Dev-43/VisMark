'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { ArrowUp } from 'lucide-react';
import { apiFetch } from '@/lib/apiFetch';
import LinkCard from '@/components/LinkCard';
import SkeletonCard from '@/components/SkeletonCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useTags } from '@/lib/hooks/useTags';
import { useToast } from '@/components/ToastProvider';

interface Tag {
  id: string;
  name: string;
}

interface RawLink {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  screenshot_url: string | null;
  favicon_url: string | null;
  snapshot_status: 'pending' | 'done' | 'failed';
  link_tags?: { tag_id: string; tags: Tag }[];
  created_at: string;
}

interface FolderData {
  id: string;
  name: string;
  is_public: boolean;
  public_slug: string | null;
}

type SortOption = 'newest' | 'oldest' | 'alpha';

export default function FolderPage() {
  const params = useParams();
  const id = params?.id as string;
  const { showToast } = useToast();

  const [folder, setFolder] = useState<FolderData | null>(null);
  const [links, setLinks] = useState<RawLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const { tags: allTags, attachTag, removeTag } = useTags();

  const handleAttachTag = async (tagId: string, linkId: string) => {
    try {
      await attachTag(tagId, linkId);
      const tagObj = allTags.find((t) => t.id === tagId);
      if (!tagObj) return;

      setLinks((prev) =>
        prev.map((link) => {
          if (link.id !== linkId) return link;
          const currentTags = link.link_tags || [];
          if (currentTags.some((lt) => lt.tag_id === tagId)) return link;
          return {
            ...link,
            link_tags: [...currentTags, { tag_id: tagId, tags: tagObj }],
          };
        })
      );
    } catch (err) {
      console.error('Failed to attach tag:', err);
      showToast('Failed to assign tag', 'error');
    }
  };

  const handleRemoveTag = async (tagId: string, linkId: string) => {
    try {
      await removeTag(tagId, linkId);
      setLinks((prev) =>
        prev.map((link) => {
          if (link.id !== linkId) return link;
          const currentTags = link.link_tags || [];
          return {
            ...link,
            link_tags: currentTags.filter((lt) => lt.tag_id !== tagId),
          };
        })
      );
    } catch (err) {
      console.error('Failed to remove tag:', err);
      showToast('Failed to remove tag', 'error');
    }
  };

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const [folderRes, linksRes] = await Promise.all([
        apiFetch(`/api/folders/${id}`),
        apiFetch(`/api/links?folder_id=${id}`),
      ]);

      if (!folderRes.ok) {
        throw new Error('Folder not found');
      }
      const folderData = await folderRes.json();
      setFolder(folderData);

      if (linksRes.ok) {
        const linksData = await linksRes.json();
        setLinks(linksData);
      }
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Failed to load folder', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Poll for pending snapshots every 3 seconds
  useEffect(() => {
    if (!id) return;
    const hasPending = links.some((l) => l.snapshot_status === 'pending');
    if (!hasPending) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await apiFetch(`/api/links?folder_id=${id}`);
        if (!res.ok) return;

        const data: RawLink[] = await res.json();
        
        // Merge pending local-only links (which start with 'temp-') if they haven't been resolved yet
        setLinks((currentLinks) => {
          const tempLinks = currentLinks.filter((l) => l.id.startsWith('temp-'));
          if (tempLinks.length > 0) {
            const resolvedUrls = new Set(data.map((l) => l.url));
            const remainingTemp = tempLinks.filter((tl) => !resolvedUrls.has(tl.url));
            return [...remainingTemp, ...data];
          }
          return data;
        });
      } catch (err) {
        console.error('Failed to poll links:', err);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [links, id]);

  const handleToggleShare = async () => {
    if (!folder) return;
    const newPublicState = !folder.is_public;

    try {
      const res = await apiFetch(`/api/folders/${folder.id}/share`, {
        method: 'PATCH',
        body: JSON.stringify({ enable: newPublicState }),
      });

      if (!res.ok) {
        throw new Error('Failed to update sharing settings');
      }

      const data = await res.json();
      setFolder((prev) =>
        prev
          ? {
              ...prev,
              is_public: data.is_public,
              public_slug: data.public_slug,
            }
          : null
      );

      if (data.is_public && data.share_url) {
        const fullUrl = window.location.origin + data.share_url;
        await navigator.clipboard.writeText(fullUrl);
        showToast('Shared successfully! Public link copied to clipboard', 'success');
      } else {
        showToast('Folder is now private', 'success');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update sharing', 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const urlToSave = newUrl.trim();
    if (!urlToSave) return;

    try {
      new URL(urlToSave);
    } catch {
      showToast('Please enter a valid URL', 'error');
      return;
    }

    setNewUrl('');

    // Immediately add pending card
    const tempId = `temp-${Date.now()}`;
    const tempLink: RawLink = {
      id: tempId,
      url: urlToSave,
      title: 'Saving link...',
      description: 'Fetching screenshot and metadata...',
      screenshot_url: null,
      favicon_url: null,
      snapshot_status: 'pending',
      created_at: new Date().toISOString(),
    };
    setLinks((prev) => [tempLink, ...prev]);

    try {
      const res = await apiFetch('/api/links', {
        method: 'POST',
        body: JSON.stringify({ url: urlToSave, folder_id: id }),
      });

      if (!res.ok) {
        throw new Error('Failed to save link');
      }

      const newLink: RawLink = await res.json();

      // Update local state with the real link info
      setLinks((prev) => prev.map((l) => (l.id === tempId ? newLink : l)));
      showToast('Link saved', 'success');
      window.dispatchEvent(new CustomEvent('folders-updated'));

      // Trigger screenshot snapshot
      try {
        await apiFetch('/api/snapshot', {
          method: 'POST',
          body: JSON.stringify({ linkId: newLink.id, url: urlToSave }),
        });
      } catch (snapshotErr) {
        console.error('Failed to trigger snapshot:', snapshotErr);
      }
    } catch (err) {
      setLinks((prev) => prev.filter((l) => l.id !== tempId));
      showToast(err instanceof Error ? err.message : 'Failed to save link', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;

    try {
      const res = await apiFetch(`/api/links/${deleteTargetId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete link');
      }

      setLinks((prev) => prev.filter((l) => l.id !== deleteTargetId));
      showToast('Link deleted successfully', 'success');
      window.dispatchEvent(new CustomEvent('folders-updated'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete link', 'error');
    } finally {
      setDeleteTargetId(null);
    }
  };

  const sortedLinks = useMemo(() => {
    return [...links].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'alpha') {
        const titleA = (a.title || a.url || '').toLowerCase();
        const titleB = (b.title || b.url || '').toLowerCase();
        return titleA.localeCompare(titleB);
      }
      return 0;
    });
  }, [links, sortBy]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        
        .links-grid {
          display: grid;
          gap: var(--space-6);
          grid-template-columns: repeat(1, minmax(0, 1fr));
        }

        @media (min-width: 640px) {
          .links-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (min-width: 1024px) {
          .links-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .toast-item {
          animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}} />

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* HEADER SECTION */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '28px',
                fontWeight: 600,
                color: 'var(--text)',
                margin: 0,
              }}
            >
              {folder?.name || (loading ? 'Loading folder...' : 'Folder')}
            </h1>
            <span
              style={{
                fontSize: '14px',
                color: 'var(--text-muted)',
                marginTop: '4px',
                display: 'block',
                fontFamily: 'var(--font-body)',
              }}
            >
              {links.length} {links.length === 1 ? 'link' : 'links'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Share Button / Badge */}
            {folder?.is_public ? (
              <button
                onClick={handleToggleShare}
                style={{
                  backgroundColor: 'rgba(22, 163, 74, 0.1)',
                  color: 'var(--success)',
                  border: '1px solid rgba(22, 163, 74, 0.2)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>Shared ✓</span>
              </button>
            ) : (
              <button
                onClick={handleToggleShare}
                disabled={loading || !folder}
                style={{
                  backgroundColor: 'var(--surface-2)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: folder ? 'pointer' : 'not-allowed',
                  opacity: folder ? 1 : 0.6,
                }}
                onMouseEnter={(e) => {
                  if (folder) e.currentTarget.style.background = 'var(--border)';
                }}
                onMouseLeave={(e) => {
                  if (folder) e.currentTarget.style.background = 'var(--surface-2)';
                }}
              >
                Share
              </button>
            )}

            {/* Sort Dropdown */}
            <div style={{ position: 'relative' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                style={{
                  appearance: 'none',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  padding: '6px 32px 6px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text)',
                  cursor: 'pointer',
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="alpha">A-Z</option>
              </select>
              <div
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '9px',
                }}
              >
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* URL INPUT BAR */}
        <div
          style={{
            position: 'sticky',
            top: '-24px',
            zIndex: 15,
            backgroundColor: 'var(--bg)',
            paddingTop: '24px',
            paddingBottom: '16px',
            marginBottom: '24px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <form
            onSubmit={handleSave}
            style={{
              display: 'flex',
              gap: '12px',
              width: '100%',
            }}
          >
            <input
              type="text"
              placeholder="Paste a URL to save it..."
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              disabled={loading || !folder}
              style={{
                flex: 1,
                padding: '12px 16px',
                fontSize: '14px',
                color: 'var(--text)',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                outline: 'none',
                fontFamily: 'var(--font-body)',
                boxShadow: 'var(--shadow-card)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-subtle)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'var(--shadow-card)';
              }}
            />
            <button
              type="submit"
              disabled={loading || !folder || !newUrl.trim()}
              style={{
                padding: '12px 24px',
                backgroundColor: 'var(--accent)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: newUrl.trim() ? 'pointer' : 'default',
                fontFamily: 'var(--font-body)',
                opacity: newUrl.trim() ? 1 : 0.6,
              }}
              onMouseEnter={(e) => {
                if (newUrl.trim()) e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
              }}
              onMouseLeave={(e) => {
                if (newUrl.trim()) e.currentTarget.style.backgroundColor = 'var(--accent)';
              }}
            >
              Save
            </button>
          </form>
        </div>

        {/* LINK GRID OR EMPTY/LOADING STATES */}
        {loading ? (
          <div className="links-grid">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} variant="link" />
            ))}
          </div>
        ) : links.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-12) var(--space-6)',
              textAlign: 'center',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-card)',
              maxWidth: '500px',
              margin: 'var(--space-8) auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--accent-subtle)',
                color: 'var(--accent)',
                marginBottom: 'var(--space-4)',
                animation: 'bounce 2s infinite',
              }}
            >
              <ArrowUp size={32} />
            </div>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--text)',
                margin: '0 0 var(--space-2) 0',
                fontFamily: 'var(--font-body)',
              }}
            >
              This folder is empty
            </h3>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--text-muted)',
                margin: 0,
                fontFamily: 'var(--font-body)',
                lineHeight: 1.5,
                maxWidth: '300px',
              }}
            >
              Paste a URL above to save your first link
            </p>
          </div>
        ) : (
          <div className="links-grid">
            {sortedLinks.map((link) => (
              <LinkCard
                key={link.id}
                id={link.id}
                url={link.url}
                title={link.title}
                description={link.description}
                screenshotUrl={link.screenshot_url}
                faviconUrl={link.favicon_url}
                snapshotStatus={link.snapshot_status}
                tags={link.link_tags?.map((lt) => lt.tags) ?? []}
                onDelete={setDeleteTargetId}
                allTags={allTags}
                onAttachTag={handleAttachTag}
                onRemoveTag={handleRemoveTag}
              />
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        title="Delete Link"
        message="Delete this link? This cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />
    </>
  );
}
