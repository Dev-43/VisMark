import React from 'react';

interface SkeletonCardProps {
  variant?: 'link' | 'folder';
}

export default function SkeletonCard({ variant = 'link' }: SkeletonCardProps) {
  const styles = (
    <style dangerouslySetInnerHTML={{ __html: `
      @keyframes shimmer-sweep {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }
      .skeleton-shimmer {
        background: linear-gradient(90deg, var(--surface-2) 25%, var(--border) 50%, var(--surface-2) 75%);
        background-size: 200% 100%;
        animation: shimmer-sweep 1.5s infinite linear;
      }
    ` }} />
  );

  if (variant === 'folder') {
    return (
      <div
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
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {styles}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px',
            }}
          >
            {/* Circle placeholder (icon area) */}
            <div
              className="skeleton-shimmer"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
              }}
            />
            {/* Menu button placeholder */}
            <div
              className="skeleton-shimmer"
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
              }}
            />
          </div>
          {/* Title placeholder */}
          <div
            className="skeleton-shimmer"
            style={{
              width: '60%',
              height: '20px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '12px',
            }}
          />
        </div>
        {/* Footer placeholder */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            className="skeleton-shimmer"
            style={{
              width: '40px',
              height: '14px',
              borderRadius: 'var(--radius-sm)',
            }}
          />
          <div
            className="skeleton-shimmer"
            style={{
              width: '50px',
              height: '20px',
              borderRadius: 'var(--radius-sm)',
            }}
          />
        </div>
      </div>
    );
  }

  // Link variant
  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {styles}
      {/* 16:9 Image Area Placeholder */}
      <div
        className="skeleton-shimmer"
        style={{
          width: '100%',
          aspectRatio: '16 / 9',
          flexShrink: 0,
        }}
      />

      {/* Content Area Placeholder */}
      <div
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          flexGrow: 1,
        }}
      >
        {/* Line 1: 80% width */}
        <div
          className="skeleton-shimmer"
          style={{
            width: '80%',
            height: '16px',
            borderRadius: 'var(--radius-sm)',
          }}
        />
        {/* Line 2: 60% width */}
        <div
          className="skeleton-shimmer"
          style={{
            width: '60%',
            height: '12px',
            borderRadius: 'var(--radius-sm)',
          }}
        />
        {/* Line 3: 40% width */}
        <div
          className="skeleton-shimmer"
          style={{
            width: '40%',
            height: '12px',
            borderRadius: 'var(--radius-sm)',
          }}
        />
      </div>
    </div>
  );
}

