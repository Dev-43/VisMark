'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/apiFetch';

interface ActivityEntry {
  id: string;
  action: string;
  target_id: string | null;
  created_at: string;
  username: string;
}

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: string;
}

const ACTION_LABELS: Record<string, string> = {
  link_added: 'added a link',
  link_deleted: 'deleted a link',
  member_invited: 'invited a member',
  member_joined: 'joined the folder',
  member_removed: 'removed a member',
  member_left: 'left the folder',
  description_edited: 'edited a description',
  public_share_toggled: 'toggled public sharing',
  delete_initiated: 'initiated folder deletion',
  ownership_transferred: 'transferred ownership',
};

function formatAction(action: string): string {
  return ACTION_LABELS[action] || action;
}

function timeAgo(dateString: string): string {
  const now = new Date();
  // Ensure the date is parsed as UTC if it doesn't have a timezone indicator
  const hasTimezone = dateString.endsWith('Z') || dateString.includes('+') || /[-+]\d{2}:\d{2}$/.test(dateString);
  const parsedDateString = hasTimezone ? dateString : `${dateString}Z`;
  const date = new Date(parsedDateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function ActivityLogModal({ isOpen, onClose, folderId }: ActivityLogModalProps) {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActivities = useCallback(async () => {
    if (!folderId) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/folders/${folderId}/activity`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (err) {
      console.error('Error fetching activity log:', err);
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    if (isOpen) {
      fetchActivities();
    }
  }, [isOpen, fetchActivities]);

  if (!isOpen) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes activity-backdrop-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes activity-modal-scale {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .activity-backdrop {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: activity-backdrop-fade 200ms ease-out forwards;
        }
        .activity-modal-box {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 28px;
          width: 90%;
          max-width: 520px;
          max-height: 80vh;
          box-shadow: var(--shadow-hover);
          animation: activity-modal-scale 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .activity-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border);
          padding-bottom: 14px;
        }
        .activity-modal-title {
          font-family: var(--font-display);
          font-size: 20px;
          color: var(--text);
          margin: 0;
          font-weight: 600;
        }
        .activity-close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: var(--radius-sm);
          transition: all var(--transition);
        }
        .activity-close-btn:hover {
          color: var(--text);
          background: var(--surface-2);
        }
        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 0;
          overflow-y: auto;
          max-height: 55vh;
          padding-right: 4px;
        }
        .activity-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
        }
        .activity-item:last-child {
          border-bottom: none;
        }
        .activity-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent);
          margin-top: 6px;
          flex-shrink: 0;
        }
        .activity-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .activity-text {
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--text);
          line-height: 1.4;
        }
        .activity-username {
          font-weight: 600;
          color: var(--accent);
        }
        .activity-time {
          font-family: var(--font-body);
          font-size: 12px;
          color: var(--text-muted);
        }
        .activity-empty-state {
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--text-muted);
          text-align: center;
          padding: 32px 0;
        }
        .activity-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 0;
          color: var(--text-muted);
          gap: 8px;
          font-family: var(--font-body);
          font-size: 14px;
        }
      `}} />

      <div className="activity-backdrop" onClick={onClose}>
        <div className="activity-modal-box" onClick={(e) => e.stopPropagation()}>
          
          {/* HEADER */}
          <div className="activity-modal-header">
            <h3 className="activity-modal-title">Activity Log</h3>
            <button className="activity-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          {/* ACTIVITY LIST */}
          {loading ? (
            <div className="activity-loading">
              <Loader2 className="animate-spin" size={18} />
              Loading activity...
            </div>
          ) : activities.length === 0 ? (
            <div className="activity-empty-state">No activity yet.</div>
          ) : (
            <div className="activity-list">
              {activities.map((entry) => (
                <div className="activity-item" key={entry.id}>
                  <div className="activity-dot" />
                  <div className="activity-content">
                    <span className="activity-text">
                      <span className="activity-username">@{entry.username}</span>{' '}
                      {formatAction(entry.action)}
                    </span>
                    <span className="activity-time">{timeAgo(entry.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
