'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, ArrowLeft, Search as SearchIcon, FolderOpen } from 'lucide-react';
import { apiFetch } from '@/lib/apiFetch';
import FolderCard, { FolderData } from '@/components/FolderCard';
import LinkCard from '@/components/LinkCard';
import SkeletonCard from '@/components/SkeletonCard';
import EmptyState from '@/components/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useTags, Tag } from '@/lib/hooks/useTags';
import { useToast } from '@/components/ToastProvider';

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
  role?: 'owner' | 'editor' | 'viewer';
}

interface RawFolder {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  is_public: boolean;
  public_slug: string | null;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchQuery = searchParams?.get('q') || '';
  const { showToast } = useToast();

  const [folders, setFolders] = useState<FolderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<FolderData | null>(null);

  // Search results states
  const [searchResults, setSearchResults] = useState<RawLink[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [deleteTargetLinkId, setDeleteTargetLinkId] = useState<string | null>(null);

  const { tags: allTags, attachTag, removeTag } = useTags();


  // Fetch search results
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }

    async function doSearch() {
      setSearchLoading(true);
      try {
        const res = await apiFetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch (err) {
        console.error(err);
        showToast('Search query failed', 'error');
      } finally {
        setSearchLoading(false);
      }
    }

    doSearch();
  }, [searchQuery, showToast]);

  const handleAttachTag = async (tagId: string, linkId: string) => {
    try {
      await attachTag(tagId, linkId);
      const tagObj = allTags.find((t) => t.id === tagId);
      if (!tagObj) return;

      setSearchResults((prev) =>
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
      console.error(err);
      showToast('Failed to assign tag', 'error');
    }
  };

  const handleRemoveTag = async (tagId: string, linkId: string) => {
    try {
      await removeTag(tagId, linkId);
      setSearchResults((prev) =>
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
      console.error(err);
      showToast('Failed to remove tag', 'error');
    }
  };

  const handleLinkDeleteConfirm = async () => {
    if (!deleteTargetLinkId) return;
    try {
      const res = await apiFetch(`/api/links/${deleteTargetLinkId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete link');

      showToast('Link deleted successfully', 'success');
      setSearchResults((prev) => prev.filter((l) => l.id !== deleteTargetLinkId));
      setDeleteTargetLinkId(null);
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Failed to delete link', 'error');
    }
  };

  const fetchFolders = useCallback(async () => {
    try {
      const res = await apiFetch('/api/folders');
      if (!res.ok) {
        throw new Error('Failed to load folders');
      }
      const data = await res.json();
      
      // Fetch link counts for each folder
      const foldersWithCounts = await Promise.all(
        data.map(async (folder: RawFolder) => {
          const linksRes = await apiFetch(`/api/links?folder_id=${folder.id}`);
          const links = linksRes.ok ? await linksRes.json() : [];
          return {
            id: folder.id,
            name: folder.name,
            linkCount: Array.isArray(links) ? links.length : 0,
            is_public: folder.is_public || false,
            created_at: folder.created_at,
          };
        })
      );
      
      setFolders(foldersWithCounts);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Failed to load folders';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchFolders();

    // Sync folders with Sidebar actions or other layout changes
    const handleUpdate = () => {
      fetchFolders();
    };
    window.addEventListener('folders-updated', handleUpdate);
    return () => {
      window.removeEventListener('folders-updated', handleUpdate);
    };
  }, [fetchFolders]);

  const handleRename = async (id: string, newName: string): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/folders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: newName }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to rename folder');
      }
      showToast('Folder renamed successfully', 'success');
      window.dispatchEvent(new CustomEvent('folders-updated'));
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to rename folder';
      showToast(message, 'error');
      return false;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const res = await apiFetch(`/api/folders/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete folder');
      }
      showToast('Folder deleted successfully', 'success');
      setDeleteTarget(null);
      window.dispatchEvent(new CustomEvent('folders-updated'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete folder';
      showToast(message, 'error');
    }
  };

  const NewFolderCard = () => {
    const [isCreating, setIsCreating] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreateSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const name = newFolderName.trim();
      if (!name) return;

      setIsSubmitting(true);
      try {
        const res = await apiFetch('/api/folders', {
          method: 'POST',
          body: JSON.stringify({ name }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to create folder');
        }
        showToast('Folder created successfully', 'success');
        setNewFolderName('');
        setIsCreating(false);
        window.dispatchEvent(new CustomEvent('folders-updated'));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to create folder';
        showToast(message, 'error');
      } finally {
        setIsSubmitting(false);
      }
    };

    if (isCreating) {
      return (
        <form
          onSubmit={handleCreateSubmit}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            boxShadow: 'var(--shadow-card)',
            minHeight: '180px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <label
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-muted)',
                marginBottom: '8px',
                display: 'block',
                fontFamily: 'var(--font-body)',
              }}
            >
              New Folder Name
            </label>
            <input
              autoFocus
              type="text"
              placeholder="Folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              disabled={isSubmitting}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsCreating(false);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '16px', // Prevents auto-zoom on iOS
                color: 'var(--text)',
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                outline: 'none',
                fontFamily: 'var(--font-body)',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="submit"
              disabled={isSubmitting || !newFolderName.trim()}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                opacity: !newFolderName.trim() ? 0.6 : 1,
              }}
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: '8px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-2)',
                color: 'var(--text)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      );
    }

    return (
      <button
        onClick={() => setIsCreating(true)}
        style={{
          background: 'transparent',
          border: '2px dashed var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          minHeight: '180px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          gap: '8px',
          width: '100%',
          textAlign: 'center',
          transition: 'border-color var(--transition), background-color var(--transition)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent)';
          e.currentTarget.style.backgroundColor = 'var(--surface-2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Plus size={40} style={{ color: 'var(--text-muted)' }} />
        <span
          style={{
            fontFamily: 'var(--font-body)',
            color: 'var(--text-muted)',
            fontSize: '16px',
            fontWeight: 500,
          }}
        >
          New Folder
        </span>
      </button>
    );
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .folders-grid, .links-grid {
          display: grid;
          gap: var(--space-6);
          grid-template-columns: repeat(1, minmax(0, 1fr));
        }

        @media (min-width: 640px) {
          .folders-grid, .links-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (min-width: 1024px) {
          .folders-grid, .links-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .skeleton-pulse {
          animation: pulse 1.5s infinite ease-in-out;
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
        {searchQuery ? (
          /* ── SEARCH RESULTS VIEW ── */
          <div>
            {/* Back Button */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: 0,
                  fontFamily: 'var(--font-body)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <ArrowLeft size={16} />
                <span>Back to folders</span>
              </button>
            </div>

            {/* Results Grid */}
            {searchLoading ? (
              <div className="links-grid">
                {[...Array(6)].map((_, i) => (
                  <SkeletonCard key={i} variant="link" />
                ))}
              </div>
            ) : searchResults.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '64px 24px',
                  textAlign: 'center',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <SearchIcon size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.5 }} />
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--text)',
                    margin: '0 0 var(--space-2) 0',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  No results found
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
                  We couldn&apos;t find any links matching &quot;{searchQuery}&quot;. Try checking for spelling errors or using different keywords.
                </p>
              </div>
            ) : (
              <div className="links-grid">
                {searchResults.map((link) => (
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
                    onDelete={setDeleteTargetLinkId}
                    allTags={allTags}
                    onAttachTag={handleAttachTag}
                    onRemoveTag={handleRemoveTag}
                    role={link.role}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ── NORMAL FOLDERS VIEW ── */
          <div>
            {loading ? (
              <div className="folders-grid">
                <NewFolderCard />
                {[...Array(6)].map((_, i) => (
                  <SkeletonCard key={i} variant="folder" />
                ))}
              </div>
            ) : folders.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', maxWidth: '340px' }}>
                  <NewFolderCard />
                </div>
                <EmptyState
                  icon={<FolderOpen />}
                  title="No folders yet"
                  description="Create your first folder to start saving links visually"
                />
              </div>
            ) : (
              <div className="folders-grid">
                <NewFolderCard />
                {folders.map((folder) => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    onRename={handleRename}
                    onDeleteClick={setDeleteTarget}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Folder Deletion */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete Folder"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All links in this folder will be deleted permanently.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Confirmation Dialog for Link Deletion */}
      <ConfirmDialog
        isOpen={deleteTargetLinkId !== null}
        title="Delete Link"
        message="Delete this link? This cannot be undone."
        onConfirm={handleLinkDeleteConfirm}
        onCancel={() => setDeleteTargetLinkId(null)}
      />
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div style={{ padding: '24px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
        Loading dashboard...
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
