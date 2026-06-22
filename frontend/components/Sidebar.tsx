"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Folder, Tag as TagIcon, Trash2, Plus, X, Check } from "lucide-react";
import { useTags } from "@/lib/hooks/useTags";

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
  currentFolderId: propFolderId,
  userEmail,
  onSignOut,
  onNewFolder,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const { tags, createTag, deleteTag } = useTags();

  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [tagError, setTagError] = useState("");
  const [isSubmittingTag, setIsSubmittingTag] = useState(false);
  const [hoveredTagId, setHoveredTagId] = useState<string | null>(null);

  const currentFolderId = propFolderId || pathname.match(/^\/dashboard\/folder\/([^/]+)/)?.[1];
  const currentTagId = pathname.match(/^\/dashboard\/tags\/([^/]+)/)?.[1];

  const handleCreateTagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newTagName.trim();
    if (!name) return;

    setIsSubmittingTag(true);
    setTagError("");
    try {
      await createTag(name);
      setNewTagName("");
      setIsCreatingTag(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create tag";
      setTagError(message);
    } finally {
      setIsSubmittingTag(false);
    }
  };

  const handleDeleteTag = async (e: React.MouseEvent, tagId: string, tagName: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete the tag #${tagName}?`)) {
      try {
        await deleteTag(tagId);
      } catch (err) {
        console.error("Failed to delete tag:", err);
      }
    }
  };

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
      {/* Brand Header */}
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

      {/* Navigation List */}
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 var(--space-3)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* FOLDERS SECTION */}
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              padding: "0 var(--space-3)",
              marginBottom: "8px",
            }}
          >
            Folders
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
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
                      e.currentTarget.style.background = "var(--border)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <Folder size={15} aria-hidden style={{ flexShrink: 0 }} />
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
                      fontSize: 11,
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
          </div>
        </div>

        {/* TAGS SECTION */}
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              padding: "0 var(--space-3)",
              marginBottom: "8px",
            }}
          >
            Tags
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {tags.map((tag) => {
              const isActive = tag.id === currentTagId;
              const isHovered = tag.id === hoveredTagId;

              return (
                <div
                  key={tag.id}
                  onMouseEnter={() => setHoveredTagId(tag.id)}
                  onMouseLeave={() => setHoveredTagId(null)}
                  style={{ position: "relative" }}
                >
                  <Link
                    href={`/dashboard/tags/${tag.id}`}
                    onClick={onNavigate}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-2)",
                      padding: "var(--space-2) var(--space-3)",
                      borderRadius: "var(--radius-sm)",
                      textDecoration: "none",
                      color: isActive ? "var(--accent)" : "var(--text)",
                      background: isActive ? "var(--accent-subtle)" : "transparent",
                      borderLeft: isActive
                        ? "3px solid var(--accent)"
                        : "3px solid transparent",
                      paddingRight: isHovered ? "36px" : "var(--space-3)", // leave space for delete button
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "var(--border)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <TagIcon size={14} aria-hidden style={{ flexShrink: 0 }} />
                    <span
                      style={{
                        flex: 1,
                        fontSize: 14,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {tag.name}
                    </span>
                  </Link>

                  {isHovered && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteTag(e, tag.id, tag.name)}
                      aria-label={`Delete tag ${tag.name}`}
                      style={{
                        position: "absolute",
                        right: "8px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "var(--radius-sm)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "var(--error)";
                        e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--text-muted)";
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Inline tag creator */}
            {isCreatingTag ? (
              <form
                onSubmit={handleCreateTagSubmit}
                style={{
                  padding: "4px var(--space-3)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  marginTop: "4px",
                }}
              >
                <div style={{ display: "flex", gap: "4px" }}>
                  <input
                    autoFocus
                    type="text"
                    placeholder="New tag..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    disabled={isSubmittingTag}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setIsCreatingTag(false);
                    }}
                    style={{
                      flex: 1,
                      padding: "6px 8px",
                      fontSize: "12px",
                      color: "var(--text)",
                      backgroundColor: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      outline: "none",
                      fontFamily: "var(--font-body)",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingTag || !newTagName.trim()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "6px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "var(--accent)",
                      color: "#ffffff",
                      border: "none",
                      cursor: "pointer",
                      opacity: !newTagName.trim() ? 0.6 : 1,
                    }}
                  >
                    <Check size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingTag(false)}
                    disabled={isSubmittingTag}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "6px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "var(--surface)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border)",
                      cursor: "pointer",
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
                {tagError && (
                  <span style={{ fontSize: "10px", color: "var(--error)" }}>
                    {tagError}
                  </span>
                )}
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreatingTag(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px var(--space-3)",
                  marginTop: "4px",
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: 12,
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "var(--font-body)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--text)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                <Plus size={12} />
                Add Tag
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Footer Actions */}
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
            fontFamily: "var(--font-body)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text)";
            e.currentTarget.style.borderColor = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-muted)";
            e.currentTarget.style.borderColor = "var(--border)";
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
            fontFamily: "var(--font-body)",
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
