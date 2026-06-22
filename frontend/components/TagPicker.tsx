'use client';
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState, useEffect, useRef } from 'react';
import { Tag } from '@/lib/hooks/useTags';
import { Plus, Check } from 'lucide-react';

interface Props {
  linkId: string;
  assignedTags: Tag[];
  allTags: Tag[];
  onAttach: (tagId: string) => Promise<void>;
  onRemove: (tagId: string) => Promise<void>;
}

export default function TagPicker({ linkId, assignedTags, allTags, onAttach, onRemove }: Props) {
  const [open, setOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const assignedSet = new Set(assignedTags.map((t) => t.id));

  // Close popover when clicking outside the component
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleToggle(tagId: string) {
    if (togglingId) return;
    setTogglingId(tagId);
    try {
      if (assignedSet.has(tagId)) {
        await onRemove(tagId);
      } else {
        await onAttach(tagId);
      }
    } catch (err) {
      console.error('Failed to toggle tag:', err);
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', display: 'inline-block' }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          fontSize: '11px',
          fontWeight: 500,
          color: 'var(--text-muted)',
          backgroundColor: 'transparent',
          border: '1px dashed var(--border)',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--text)';
          e.currentTarget.style.borderColor = 'var(--accent)';
          e.currentTarget.style.backgroundColor = 'var(--accent-subtle)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-muted)';
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Plus size={11} />
        Tag
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            marginBottom: '6px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-card)',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            minWidth: '180px',
            maxWidth: '240px',
            zIndex: 30,
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '2px 4px',
              borderBottom: '1px solid var(--border)',
              marginBottom: '4px',
            }}
          >
            Select Tags
          </div>
          {allTags.length === 0 && (
            <p
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                margin: '8px 4px',
                textAlign: 'center',
              }}
            >
              No tags created yet
            </p>
          )}
          {allTags.map((tag) => {
            const isActive = assignedSet.has(tag.id);
            const isToggling = togglingId === tag.id;

            return (
              <button
                key={tag.id}
                type="button"
                disabled={isToggling}
                onClick={() => handleToggle(tag.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '5px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  border: 'none',
                  textAlign: 'left',
                  cursor: isToggling ? 'not-allowed' : 'pointer',
                  backgroundColor: isActive ? 'var(--accent-subtle)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text)',
                  fontWeight: isActive ? 600 : 400,
                  fontFamily: 'var(--font-body)',
                  opacity: isToggling ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'var(--surface-2)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginRight: '8px',
                  }}
                >
                  #{tag.name}
                </span>
                {isActive && <Check size={12} style={{ flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}