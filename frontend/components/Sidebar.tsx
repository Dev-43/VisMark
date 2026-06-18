"use client";

import Link from "next/link";
import { Bookmark, Folder } from "lucide-react";

export type SidebarFolder = {
  id: string;
  name: string;
  linkCount: number;
};

interface SidebarProps {
  folders: SidebarFolder[];
  currentFolderId?: string;
  userEmail: string;
  onSignOut: () => void;
  onNewFolder: () => void;
  onNavigate?: () => void;
}

function UserAvatar({ email }: { email: string }) {
  const initial = email ? email.charAt(0).toUpperCase() : "?";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: "var(--accent)",
        color: "#ffffff",
        fontSize: 14,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initial}
    </span>
  );
}

export function Sidebar({
  folders,
  currentFolderId,
  userEmail,
  onSignOut,
  onNewFolder,
  onNavigate,
}: SidebarProps) {
  return (
    <aside
      style={{
        display: "flex",
        flexDirection: "column",
        width: 240,
        height: "100%",
        background: "var(--surface-2)",
        borderRight: "1px solid var(--border)",
      }}
    >
      <div style={{ padding: "var(--space-6)" }}>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            textDecoration: "none",
          }}
        >
          <Bookmark
            size={22}
            style={{ color: "var(--accent)", flexShrink: 0 }}
            aria-hidden
          />
          <span
            className="font-display"
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "var(--text)",
            }}
          >
            VisMark
          </span>
        </Link>
      </div>

      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 var(--space-3)",
        }}
      >
        {folders.map((folder) => {
          const isActive = folder.id === currentFolderId;

          return (
            <Link
              key={folder.id}
              href={`/dashboard/folder/${folder.id}`}
              onClick={onNavigate}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                padding: "var(--space-2) var(--space-3)",
                marginBottom: "var(--space-1)",
                borderRadius: "var(--radius-sm)",
                textDecoration: "none",
                color: isActive ? "var(--accent)" : "var(--text)",
                background: isActive ? "var(--accent-subtle)" : "transparent",
                borderLeft: isActive
                  ? "3px solid var(--accent)"
                  : "3px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "var(--surface-2)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <Folder size={16} aria-hidden style={{ flexShrink: 0 }} />
              <span
                style={{
                  flex: 1,
                  fontSize: 14,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {folder.name}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  background: "var(--surface)",
                  borderRadius: "var(--radius-sm)",
                  padding: "2px 6px",
                  flexShrink: 0,
                }}
              >
                {folder.linkCount}
              </span>
            </Link>
          );
        })}
      </nav>

      <div
        style={{
          padding: "var(--space-4)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <button
          type="button"
          onClick={onNewFolder}
          style={{
            width: "100%",
            padding: "var(--space-2) var(--space-3)",
            marginBottom: "var(--space-4)",
            border: "1px dashed var(--border)",
            borderRadius: "var(--radius-md)",
            background: "transparent",
            color: "var(--text-muted)",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          + New Folder
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            marginBottom: "var(--space-3)",
          }}
        >
          <UserAvatar email={userEmail} />
          <span
            style={{
              fontSize: 13,
              color: "var(--text)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {userEmail}
          </span>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          style={{
            width: "100%",
            padding: "var(--space-2)",
            border: "none",
            borderRadius: "var(--radius-sm)",
            background: "transparent",
            color: "var(--text-muted)",
            fontSize: 13,
            cursor: "pointer",
            textAlign: "left",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--error)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
