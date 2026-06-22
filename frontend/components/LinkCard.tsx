'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import { ExternalLink, Copy, Trash2, Loader2 } from 'lucide-react';
import TagPicker from './TagPicker';

interface Tag {
  id: string;
  name: string;
}

export interface LinkCardProps {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  screenshotUrl: string | null;
  faviconUrl: string | null;
  snapshotStatus: 'pending' | 'done' | 'failed';
  tags: Tag[];
  onDelete: (id: string) => void;
  allTags?: Tag[];
  onAttachTag?: (tagId: string, linkId: string) => Promise<void>;
  onRemoveTag?: (tagId: string, linkId: string) => Promise<void>;
}

const TagChip = ({ name }: { name: string }) => {
  return (
    <span
      style={{
        display: 'inline-block',
        backgroundColor: 'var(--accent-subtle)',
        color: 'var(--accent)',
        borderRadius: 'var(--radius-sm)',
        padding: '2px 8px',
        fontSize: '11px',
        fontFamily: 'var(--font-body)',
        fontWeight: 500,
      }}
    >
      {name}
    </span>
  );
};

export default function LinkCard({
  id,
  url,
  title,
  description,
  screenshotUrl,
  faviconUrl,
  snapshotStatus,
  tags,
  onDelete,
  allTags,
  onAttachTag,
  onRemoveTag,
}: LinkCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleOpenUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank');
  };

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(id);
  };

  const getDomain = (urlString: string) => {
    try {
      return new URL(urlString).hostname || urlString;
    } catch {
      return urlString;
    }
  };

  const domain = getDomain(url);

  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        transition: 'all var(--transition)',
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transform: isHovering ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovering ? 'var(--shadow-hover)' : 'var(--shadow-card)',
        borderColor: isHovering ? 'rgba(79, 70, 229, 0.5)' : 'var(--border)',
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={handleOpenUrl}
    >
      {/* IMAGE AREA */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          backgroundColor: 'var(--surface-2)',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {screenshotUrl ? (
          <img
            src={screenshotUrl}
            alt={title || 'Screenshot'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : snapshotStatus === 'pending' ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              background: 'linear-gradient(90deg, var(--surface-2) 0%, var(--border) 50%, var(--surface-2) 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s infinite',
              gap: '8px',
            }}
          >
            <Loader2
              size={20}
              style={{
                color: 'var(--text-muted)',
                animation: 'spin 1s linear infinite',
              }}
            />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
              Capturing...
            </span>
          </div>
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              backgroundColor: 'var(--surface-2)',
              gap: '12px',
              padding: '16px',
            }}
          >
            {faviconUrl ? (
              <img
                src={faviconUrl}
                alt=""
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                }}
              />
            ) : (
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--accent-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {domain.charAt(0).toUpperCase()}
              </div>
            )}
            <span
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textAlign: 'center',
                wordBreak: 'break-all',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {domain}
            </span>
          </div>
        )}

        {/* GRADIENT OVERLAY */}
        {(screenshotUrl || snapshotStatus === 'done') && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '60px',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* FAVICON + DOMAIN OVERLAY */}
        {(screenshotUrl || snapshotStatus === 'done') && (
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              zIndex: 10,
            }}
          >
            {faviconUrl && (
              <img
                src={faviconUrl}
                alt=""
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '2px',
                }}
              />
            )}
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'white',
                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
              }}
            >
              {domain}
            </span>
          </div>
        )}
      </div>

      {/* CONTENT AREA */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        {(tags.length > 0 || (allTags && allTags.length > 0)) && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              marginBottom: '10px',
              alignItems: 'center',
            }}
          >
            {tags.map((tag) => (
              <TagChip key={tag.id} name={tag.name} />
            ))}
            {allTags && onAttachTag && onRemoveTag && (
              <TagPicker
                linkId={id}
                assignedTags={tags}
                allTags={allTags}
                onAttach={(tagId) => onAttachTag(tagId, id)}
                onRemove={(tagId) => onRemoveTag(tagId, id)}
              />
            )}
          </div>
        )}

        <h3
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--text)',
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontFamily: 'var(--font-body)',
            lineHeight: 1.4,
          }}
        >
          {title || 'Untitled'}
        </h3>

        {description && (
          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              margin: '6px 0 0 0',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              fontFamily: 'var(--font-body)',
              lineHeight: 1.4,
            }}
          >
            {description}
          </p>
        )}
      </div>

      {/* HOVER ACTION BAR */}
      {isHovering && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '48px',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
            paddingRight: '12px',
            zIndex: 20,
            borderBottomLeftRadius: 'var(--radius-lg)',
            borderBottomRightRadius: 'var(--radius-lg)',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          <button
            onClick={handleOpenUrl}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: 'white',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background var(--transition)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <ExternalLink size={14} />
            Open
          </button>

          <button
            onClick={handleCopyUrl}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: 'white',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background var(--transition)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <Copy size={14} />
            {copied ? 'Copied' : 'Copy'}
          </button>

          <button
            onClick={handleDelete}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: '#f87171',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background var(--transition)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.35)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.color = '#f87171';
            }}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}} />
    </div>
  );
}
