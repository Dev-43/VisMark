import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes empty-state-fade-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .empty-state-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          text-align: center;
          width: 100%;
          min-height: 280px;
          animation: empty-state-fade-in 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .empty-state-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          transition: transform var(--transition), color var(--transition);
        }
        .empty-state-icon:hover {
          transform: scale(1.05);
          color: var(--accent);
        }
        .empty-state-icon svg {
          width: 48px !important;
          height: 48px !important;
          stroke-width: 1.5;
        }
        .empty-state-title {
          font-family: var(--font-display);
          font-size: 20px;
          color: var(--text);
          margin: 16px 0 0 0;
          font-weight: 600;
          letter-spacing: -0.01em;
        }
        .empty-state-description {
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--text-muted);
          margin: 8px 0 0 0;
          max-width: 320px;
          text-align: center;
          line-height: 1.6;
        }
        .empty-state-action-btn {
          margin-top: 24px;
          background: var(--accent);
          color: #ffffff;
          border: none;
          border-radius: var(--radius-md);
          padding: 10px 20px;
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          transition: background-color var(--transition), transform var(--transition), box-shadow var(--transition);
        }
        .empty-state-action-btn:hover {
          background: var(--accent-hover);
          transform: translateY(-1px);
          box-shadow: var(--shadow-hover);
        }
        .empty-state-action-btn:active {
          transform: translateY(0);
        }
      ` }} />
      <div className="empty-state-container">
        <div className="empty-state-icon">
          {icon}
        </div>
        <h3 className="empty-state-title">{title}</h3>
        <p className="empty-state-description">{description}</p>
        {action && (
          <button
            type="button"
            className="empty-state-action-btn"
            onClick={action.onClick}
          >
            {action.label}
          </button>
        )}
      </div>
    </>
  );
}
