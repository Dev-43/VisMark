import React from 'react';

export default function SkeletonCard() {
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
      className="skeleton-pulse"
    >
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '16px',
          }}
        >
          {/* Folder icon placeholder */}
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface-2)',
            }}
          />
          {/* Menu button placeholder */}
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'var(--surface-2)',
            }}
          />
        </div>
        {/* Title placeholder */}
        <div
          style={{
            width: '60%',
            height: '20px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-2)',
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
          style={{
            width: '40px',
            height: '14px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-2)',
          }}
        />
        <div
          style={{
            width: '50px',
            height: '20px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-2)',
          }}
        />
      </div>
    </div>
  );
}
