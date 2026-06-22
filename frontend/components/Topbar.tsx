"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface TopbarProps {
  pageTitle: string;
  userEmail: string;
  onMenuClick?: () => void;
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

export function Topbar({ pageTitle, userEmail, onMenuClick }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input value with search query parameter in URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("q") || "";
      setQuery(q);
    }
  }, [pathname]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/dashboard?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-4)",
        height: 56,
        padding: "0 var(--space-6)",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
    >
      {onMenuClick && (
        <button
          type="button"
          className="topbar-menu-btn"
          onClick={onMenuClick}
          aria-label="Open menu"
          style={{
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            padding: 0,
            border: "none",
            borderRadius: "var(--radius-md)",
            background: "transparent",
            color: "var(--text)",
            cursor: "pointer",
          }}
        >
          <Menu size={20} aria-hidden />
        </button>
      )}

      <h1
        style={{
          margin: 0,
          fontSize: 16,
          fontWeight: 600,
          color: "var(--text)",
          flexShrink: 0,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {pageTitle}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="topbar-search-form"
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          maxWidth: focused ? 480 : 360,
          margin: "0 auto",
          transition: "max-width var(--transition)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
          }}
        >
          <Search
            size={16}
            aria-hidden
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search your links..."
            style={{
              width: "100%",
              height: 36,
              padding: "0 72px 0 36px",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              background: "var(--bg)",
              color: "var(--text)",
              fontSize: 14,
              outline: "none",
            }}
          />
          {!focused && (
            <span
              className="topbar-search-kbd"
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 11,
                color: "var(--text-muted)",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "2px 6px",
                lineHeight: 1.4,
              }}
            >
              ⌘K
            </span>
          )}
        </div>
      </form>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          flexShrink: 0,
        }}
      >
        <ThemeToggle />
        <UserAvatar email={userEmail} />
      </div>

      <style jsx global>{`
        @media (max-width: 767px) {
          .topbar-menu-btn {
            display: inline-flex !important;
          }

          .topbar-search-form {
            display: none !important;
          }

          .topbar-search-kbd {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
