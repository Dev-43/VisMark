'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, AlertCircle, Tag as TagIcon } from 'lucide-react';
import { apiFetch } from '@/lib/apiFetch';
import LinkCard from '@/components/LinkCard';
import SkeletonCard from '@/components/SkeletonCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useTags, Tag } from '@/lib/hooks/useTags';

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

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

type SortOption = 'newest' | 'oldest' | 'alpha';

export default function TagPage() {
  const params = useParams();
  const router = useRouter();
  const tagId = params?.tagId as string;

  const [tagName, setTagName] = useState('');
  const [links, setLinks] = useState<RawLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const { tags: allTags, attachTag, removeTag } = useTags();

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    const toastId = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id: toastId, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 3000);
  }, []);

  const fetchData = useCallback(async () => {
    if (!tagId) return;
    try {
      const [tagsRes, linksRes] = await Promise.all([
        apiFetch('/api/tags'),
        apiFetch(`/api/tags/${tagId}/links`),
      ]);

      if (tagsRes.ok) {
        const tagsData: Tag[] = await tagsRes.json();
        const tag = tagsData.find((t) => t.id === tagId);
        if (tag) {
          setTagName(tag.name);
        } else {
          showToast('Tag not found', 'error');
          router.push('/dashboard');
          return;
        }
      }

      if (linksRes.ok) {
        const linksData = await linksRes.json();
        setLinks(linksData);
      } else {
        throw new Error('Failed to load links for this tag');
      }
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Failed to load tag details', 'error');
    } finally {
      setLoading(false);
    }
  }, [tagId, showToast, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAttachTag = async (newTagId: string, linkId: string) => {
    try {
      await attachTag(newTagId, linkId);
      const tagObj = allTags.find((t) => t.id === newTagId);
      if (!tagObj) return;

      setLinks((prev) =>
        prev.map((link) => {
          if (link.id !== linkId) return link;
          const currentTags = link.link_tags || [];
          if (currentTags.some((lt) => lt.tag_id === newTagId)) return link;
          return {
            ...link,
            link_tags: [...currentTags, { tag_id: newTagId, tags: tagObj }],
          };
        })
      );
    } catch (err) {
      console.error('Failed to attach tag:', err);
      showToast('Failed to assign tag', 'error');
    }
  };

  const handleRemoveTag = async (oldTagId: string, linkId: string) => {
    try {
      await removeTag(oldTagId, linkId);
      // Premium reactive behavior: if the tag we are removing is the active page tag,
      // hide the link immediately from the current list!
      if (oldTagId === tagId) {
        setLinks((prev) => prev.filter((link) => link.id !== linkId));
        showToast('Tag removed from link', 'success');
      } else {
        setLinks((prev) =>
          prev.map((link) => {
            if (link.id !== linkId) return link;
            const currentTags = link.link_tags || [];
            return {
              ...link,
              link_tags: currentTags.filter((lt) => lt.tag_id !== oldTagId),
            };
          })
        );
      }
    } catch (err) {
      console.error('Failed to remove tag:', err);
      showToast('Failed to remove tag', 'error');
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
      showToast('Link deleted successfully', 'success');
      setLinks((prev) => prev.filter((l) => l.id !== deleteTargetId));
      setDeleteTargetId(null);
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Failed to delete link', 'error');
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
        .links-grid {
          display: grid;
          gap: var(--space-6);
          grid-template-columns: repeat(1, minmax(0, 1fr));
          margin-top: var(--space-6);
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
        {/* Breadcrumb Navigation */}
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <button
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

        {/* Page Title & Details */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '20px',
            marginBottom: 'var(--space-6)',
          }}
        >
          <div>
            <h1
              className="font-display"
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--text)',
                margin: '0 0 6px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <TagIcon size={24} style={{ color: 'var(--accent)' }} />
              <span>#{tagName}</span>
            </h1>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--text-muted)',
                margin: 0,
                fontFamily: 'var(--font-body)',
              }}
            >
              {loading ? 'Loading links...' : `${links.length} visual links tagged`}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="alpha">Alphabetical</option>
              </select>
              <div
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  borderTop: '5px solid var(--text-muted)',
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                }}
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="links-grid" style={{ marginTop: 0 }}>
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : links.length === 0 ? (
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
            <TagIcon size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.5 }} />
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--text)',
                margin: '0 0 var(--space-2) 0',
                fontFamily: 'var(--font-body)',
              }}
            >
              No links under this tag
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
              Assign this tag to some of your visual links inside your folders.
            </p>
          </div>
        ) : (
          <div className="links-grid" style={{ marginTop: 0 }}>
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
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />

      {/* Toast Notification Container */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="toast-item"
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text)',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            {toast.type === 'success' ? (
              <CheckCircle size={18} style={{ color: 'var(--success)' }} />
            ) : (
              <AlertCircle size={18} style={{ color: 'var(--error)' }} />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </>
  );
}