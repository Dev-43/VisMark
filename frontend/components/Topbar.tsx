"use client";

import { FormEvent, useEffect, useRef, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, Search, Bell, Check, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { apiFetch } from "@/lib/apiFetch";

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

interface NotificationItem {
  id: string;
  type: string;
  status: string;
  created_at: string;
  folder: { id: string; name: string } | null;
  role: string;
  sender: string;
}

export function Topbar({ pageTitle, userEmail, onMenuClick }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiFetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAccept = async (id: string) => {
    setActioningId(id);
    try {
      const res = await apiFetch(`/api/notifications/${id}/accept`, {
        method: "POST",
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        window.dispatchEvent(new Event("folders-updated"));
      } else {
        const err = await res.json();
        alert(err.error || "Failed to accept invite");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    } finally {
      setActioningId(null);
    }
  };

  const handleDecline = async (id: string) => {
    setActioningId(id);
    try {
      const res = await apiFetch(`/api/notifications/${id}/decline`, {
        method: "POST",
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      } else {
        const err = await res.json();
        alert(err.error || "Failed to decline invite");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    } finally {
      setActioningId(null);
    }
  };

  // Sync input value with search query parameter in URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("q") || "";
      setQuery(q);
    }
    setMobileSearchOpen(false); // Close mobile search overlay on route change
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
    setMobileSearchOpen(false); // Close mobile search overlay on submit
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
      {mobileSearchOpen ? (
        <div style={{ display: "flex", width: "100%", alignItems: "center", gap: "var(--space-3)" }}>
          <button
            type="button"
            onClick={() => setMobileSearchOpen(false)}
            aria-label="Close search"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              border: "none",
              borderRadius: "var(--radius-md)",
              background: "transparent",
              color: "var(--text)",
              cursor: "pointer",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <form
            onSubmit={handleSubmit}
            style={{
              flex: 1,
              display: "flex",
            }}
          >
            <div style={{ position: "relative", width: "100%" }}>
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
                placeholder="Search your links..."
                style={{
                  width: "100%",
                  height: 36,
                  padding: "0 12px 0 36px",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg)",
                  color: "var(--text)",
                  fontSize: 16, // Prevents auto-zoom on iOS
                  outline: "none",
                }}
              />
            </div>
          </form>
        </div>
      ) : (
        <>
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
            <button
              type="button"
              className="topbar-mobile-search-btn"
              onClick={() => {
                setMobileSearchOpen(true);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              aria-label="Search"
              style={{
                display: "none",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                border: "none",
                borderRadius: "var(--radius-md)",
                background: "transparent",
                color: "var(--text)",
                cursor: "pointer",
              }}
            >
              <Search size={20} aria-hidden />
            </button>

            {/* Notifications Dropdown */}
            <div ref={notifRef} style={{ position: "relative" }}>
              <button
                type="button"
                aria-label="Notifications"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  background: isNotifOpen ? "var(--surface-2)" : "transparent",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  position: "relative"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--text)";
                  e.currentTarget.style.background = "var(--surface-2)";
                }}
                onMouseLeave={(e) => {
                  if (!isNotifOpen) {
                    e.currentTarget.style.color = "var(--text-muted)";
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <Bell size={20} aria-hidden />
                {notifications.length > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      width: 16,
                      height: 16,
                      background: "var(--error)",
                      color: "#ffffff",
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid var(--surface)"
                    }}
                  >
                    {notifications.length}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "100%",
                    marginTop: 8,
                    width: 300,
                    maxWidth: "calc(100vw - 32px)",
                    maxHeight: 400,
                    overflowY: "auto",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    boxShadow: "var(--shadow-card)",
                    padding: "var(--space-3)",
                    zIndex: 100,
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-2)"
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text)",
                      paddingBottom: 8,
                      borderBottom: "1px solid var(--border)",
                      marginBottom: 4,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <span>Notifications</span>
                    {notifications.length > 0 && (
                      <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>
                        {notifications.length} pending
                      </span>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div
                      style={{
                        padding: "var(--space-4) 0",
                        textAlign: "center",
                        color: "var(--text-muted)",
                        fontSize: 13
                      }}
                    >
                      No notifications
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            padding: "8px",
                            borderRadius: "var(--radius-sm)",
                            background: "var(--bg)",
                            border: "1px solid var(--border)"
                          }}
                        >
                          <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.4 }}>
                            <strong>@{notif.sender}</strong> invited you to join <strong>{notif.folder?.name || "a folder"}</strong> as <strong>{notif.role}</strong>.
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              type="button"
                              disabled={actioningId !== null}
                              onClick={() => handleAccept(notif.id)}
                              style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 4,
                                padding: "6px var(--space-2)",
                                background: "var(--accent)",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "var(--radius-sm)",
                                fontSize: 12,
                                fontWeight: 500,
                                cursor: "pointer",
                                opacity: actioningId !== null ? 0.6 : 1
                              }}
                            >
                              <Check size={12} />
                              Accept
                            </button>
                            <button
                              type="button"
                              disabled={actioningId !== null}
                              onClick={() => handleDecline(notif.id)}
                              style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 4,
                                padding: "6px var(--space-2)",
                                background: "var(--surface)",
                                color: "var(--text-muted)",
                                border: "1px solid var(--border)",
                                borderRadius: "var(--radius-sm)",
                                fontSize: 12,
                                fontWeight: 500,
                                cursor: "pointer",
                                opacity: actioningId !== null ? 0.6 : 1
                              }}
                            >
                              <X size={12} />
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <ThemeToggle />
            <UserAvatar email={userEmail} />
          </div>
        </>
      )}

      <style jsx global>{`
        @media (max-width: 767px) {
          .topbar-menu-btn {
            display: inline-flex !important;
          }

          .topbar-mobile-search-btn {
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
