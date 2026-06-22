'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/apiFetch';
import FolderCard, { FolderData } from '@/components/FolderCard';
import SkeletonCard from '@/components/SkeletonCard';
import EmptyState from '@/components/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface RawFolder {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  is_public: boolean;
  public_slug: string | null;
}

export default function Page() {
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<FolderData | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Lightweight custom Toast helper
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

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
                fontSize: '14px',
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
        .folders-grid {
          display: grid;
          gap: var(--space-6);
          grid-template-columns: repeat(1, minmax(0, 1fr));
        }

        @media (min-width: 640px) {
          .folders-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (min-width: 1024px) {
          .folders-grid {
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
        {loading ? (
          <div className="folders-grid">
            <NewFolderCard />
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : folders.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', maxWidth: '340px' }}>
              <NewFolderCard />
            </div>
            <EmptyState
              message="No folders yet"
              subMessage="Create your first folder to start saving links visually"
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

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete Folder"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All links in this folder will be deleted permanently.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
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
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderLeft: `4px solid ${toast.type === 'success' ? 'var(--success)' : 'var(--error)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              boxShadow: 'var(--shadow-hover)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              minWidth: '280px',
              maxWidth: '360px',
            }}
          >
            {toast.type === 'success' ? (
              <CheckCircle size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
            ) : (
              <AlertCircle size={18} style={{ color: 'var(--error)', flexShrink: 0 }} />
            )}
            <span
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {toast.message}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
