import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes confirm-backdrop-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes confirm-dialog-scale-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .confirm-backdrop {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: confirm-backdrop-fade-in 200ms ease-out forwards;
        }
        .confirm-dialog-box {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 32px;
          width: 90%;
          max-width: 420px;
          box-shadow: var(--shadow-hover);
          animation: confirm-dialog-scale-in 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .confirm-dialog-title {
          font-family: var(--font-display);
          font-size: 20px;
          color: var(--text);
          margin: 0;
          font-weight: 600;
        }
        .confirm-dialog-message {
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--text-muted);
          margin: 8px 0 0 0;
          line-height: 1.5;
        }
        .confirm-buttons-row {
          margin-top: 24px;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .confirm-btn-cancel {
          background: transparent;
          border: none;
          padding: 8px 16px;
          border-radius: var(--radius-md);
          color: var(--text-muted);
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition);
        }
        .confirm-btn-cancel:hover {
          color: var(--text);
          background: var(--surface-2);
        }
        .confirm-btn-confirm {
          background: var(--error);
          border: none;
          padding: 8px 16px;
          border-radius: var(--radius-md);
          color: #ffffff;
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition);
        }
        .confirm-btn-confirm:hover {
          opacity: 0.9;
        }
      ` }} />
      <div className="confirm-backdrop" onClick={onCancel}>
        <div className="confirm-dialog-box" onClick={(e) => e.stopPropagation()}>
          <h3 className="confirm-dialog-title">{title}</h3>
          <p className="confirm-dialog-message">{message}</p>
          <div className="confirm-buttons-row">
            <button type="button" className="confirm-btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button type="button" className="confirm-btn-confirm" onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

