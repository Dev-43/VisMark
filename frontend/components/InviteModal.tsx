import React, { useState, useEffect, useCallback } from 'react';
import { X, Loader2, Check, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/apiFetch';
import { useToast } from '@/components/ToastProvider';

interface InvitedUser {
  id: string;
  username: string;
}

interface PendingInvite {
  id: string;
  role: 'editor' | 'viewer';
  status: string;
  created_at: string;
  invited_user: InvitedUser;
}

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: string;
}

export default function InviteModal({ isOpen, onClose, folderId }: InviteModalProps) {
  const { showToast } = useToast();
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [checking, setChecking] = useState(false);
  const [exists, setExists] = useState<boolean | null>(null);
  
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [sending, setSending] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  // Fetch pending invites
  const fetchInvites = useCallback(async () => {
    if (!folderId) return;
    setLoadingInvites(true);
    try {
      const res = await apiFetch(`/api/folders/${folderId}/invites`);
      if (res.ok) {
        const data = await res.json();
        setInvites(data);
      }
    } catch (err) {
      console.error('Error fetching invites:', err);
    } finally {
      setLoadingInvites(false);
    }
  }, [folderId]);

  // Load invites when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchInvites();
      setUsername('');
      setExists(null);
      setRole('editor');
    }
  }, [isOpen, fetchInvites]);

  // Debounced username existence check
  useEffect(() => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed || trimmed.length < 3) {
      setExists(null);
      setChecking(false);
      return;
    }

    setChecking(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await apiFetch(`/api/profiles/exists?username=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setExists(data.exists);
        } else {
          setExists(false);
        }
      } catch (err) {
        console.error('Error checking user existence:', err);
        setExists(null);
      } finally {
        setChecking(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [username]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim().toLowerCase();
    if (!trimmed || !exists || checking || sending) return;

    setSending(true);
    try {
      const res = await apiFetch(`/api/folders/${folderId}/invites`, {
        method: 'POST',
        body: JSON.stringify({ username: trimmed, role }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to send invite');
      }

      showToast(`Invite sent to @${trimmed}`, 'success');
      setUsername('');
      setExists(null);
      fetchInvites();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send invite', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (cancelingId) return;
    setCancelingId(inviteId);
    try {
      const res = await apiFetch(`/api/folders/${folderId}/invites/${inviteId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to cancel invite');
      }

      showToast('Invite cancelled successfully', 'success');
      fetchInvites();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to cancel invite', 'error');
    } finally {
      setCancelingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes invite-backdrop-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes invite-modal-scale {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .invite-backdrop {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: invite-backdrop-fade 200ms ease-out forwards;
        }
        .invite-modal-box {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 28px;
          width: 90%;
          max-width: 480px;
          box-shadow: var(--shadow-hover);
          animation: invite-modal-scale 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .invite-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border);
          padding-bottom: 14px;
        }
        .invite-modal-title {
          font-family: var(--font-display);
          font-size: 20px;
          color: var(--text);
          margin: 0;
          font-weight: 600;
        }
        .invite-close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: var(--radius-sm);
          transition: all var(--transition);
        }
        .invite-close-btn:hover {
          color: var(--text);
          background: var(--surface-2);
        }
        .invite-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .invite-field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .invite-label {
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 500;
          color: var(--text-muted);
        }
        .invite-input-container {
          position: relative;
          display: flex;
          align-items: center;
        }
        .invite-input {
          width: 100%;
          padding: 10px 36px 10px 14px;
          font-size: 14px;
          color: var(--text);
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          outline: none;
          font-family: var(--font-body);
          transition: all var(--transition);
        }
        .invite-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 2px var(--accent-subtle);
        }
        .invite-input-status-icon {
          position: absolute;
          right: 12px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
        }
        .invite-validation-msg {
          font-family: var(--font-body);
          font-size: 12px;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .invite-role-select {
          padding: 10px 14px;
          font-size: 14px;
          color: var(--text);
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          outline: none;
          font-family: var(--font-body);
          cursor: pointer;
        }
        .invite-submit-btn {
          padding: 10px 16px;
          background: var(--accent);
          color: #ffffff;
          border: none;
          border-radius: var(--radius-md);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all var(--transition);
        }
        .invite-submit-btn:hover:not(:disabled) {
          background: var(--accent-hover);
        }
        .invite-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .invites-section {
          border-top: 1px solid var(--border);
          padding-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 200px;
          overflow-y: auto;
        }
        .invites-section-title {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 600;
          color: var(--text);
          margin: 0;
        }
        .invites-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .invite-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
        }
        .invite-item-user {
          display: flex;
          flex-direction: column;
          gap: 2px;
                    overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .invite-item-username {
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
        }
        .invite-item-role {
          font-family: var(--font-body);
          font-size: 11px;
          color: var(--text-muted);
          text-transform: capitalize;
        }
        .invite-item-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .invite-status-badge {
          font-size: 11px;
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          font-weight: 500;
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }
        .invite-cancel-btn {
          background: transparent;
          border: none;
          color: var(--error);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          transition: all var(--transition);
        }
        .invite-cancel-btn:hover {
          background: rgba(239, 68, 68, 0.1);
        }
        .invite-empty-state {
          font-family: var(--font-body);
          font-size: 13px;
          color: var(--text-muted);
          text-align: center;
          padding: 12px 0;
        }
      `}} />

      <div className="invite-backdrop" onClick={onClose}>
        <div className="invite-modal-box" onClick={(e) => e.stopPropagation()}>
          
          {/* HEADER */}
          <div className="invite-modal-header">
            <h3 className="invite-modal-title">Invite Members</h3>
            <button className="invite-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          {/* INVITE FORM */}
          <form className="invite-form" onSubmit={handleSendInvite}>
            <div className="invite-field-group">
              <label className="invite-label" htmlFor="invite-username">
                Invited Username
              </label>
              <div className="invite-input-container">
                <input
                  id="invite-username"
                  className="invite-input"
                  type="text"
                  placeholder="e.g. johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={sending}
                  autoComplete="off"
                />
                <div className="invite-input-status-icon">
                  {checking && <Loader2 className="animate-spin" size={16} />}
                </div>
              </div>

              {/* LIVE VALIDATION MESSAGE */}
              {username.trim().length >= 3 && !checking && (
                <div className="invite-validation-msg" style={{
                  color: exists ? 'var(--success)' : 'var(--error)'
                }}>
                  {exists ? (
                    <>
                      <Check size={14} />
                      <span>@{username.trim().toLowerCase()} exists and is ready to invite</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={14} />
                      <span>User not found</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="invite-field-group">
              <label className="invite-label" htmlFor="invite-role">
                Role
              </label>
              <select
                id="invite-role"
                className="invite-role-select"
                value={role}
                onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
                disabled={sending}
              >
                <option value="editor">Editor (can add/delete links)</option>
                <option value="viewer">Viewer (read-only)</option>
              </select>
            </div>

            <button
              className="invite-submit-btn"
              type="submit"
              disabled={sending || checking || !exists || !username.trim()}
            >
              {sending ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Sending...
                </>
              ) : (
                'Send Invite'
              )}
            </button>
          </form>

          {/* PENDING INVITES LIST */}
          <div className="invites-section">
            <h4 className="invites-section-title">Pending Invites</h4>
            
            {loadingInvites ? (
              <div className="invite-empty-state">Loading invites...</div>
            ) : invites.length === 0 ? (
              <div className="invite-empty-state">No pending invites.</div>
            ) : (
              <div className="invites-list">
                {invites.map((invite) => (
                  <div className="invite-item" key={invite.id}>
                    <div className="invite-item-user">
                      <span className="invite-item-username">
                        @{invite.invited_user?.username}
                      </span>
                      <span className="invite-item-role">
                        Role: {invite.role}
                      </span>
                    </div>
                    <div className="invite-item-actions">
                      <span className="invite-status-badge">
                        Pending
                      </span>
                      <button
                        className="invite-cancel-btn"
                        type="button"
                        onClick={() => handleCancelInvite(invite.id)}
                        disabled={cancelingId === invite.id}
                      >
                        {cancelingId === invite.id ? '...' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
