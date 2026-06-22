import React from 'react';
import { FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  message: string;
  subMessage: string;
}

export default function EmptyState({ message, subMessage }: EmptyStateProps) {
  return (
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
        }}
      >
        <FolderOpen size={32} />
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
        {message}
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
        {subMessage}
      </p>
    </div>
  );
}
