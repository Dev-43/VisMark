"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { apiFetch } from "@/lib/apiFetch";
import { Sidebar, type SidebarFolder } from "./Sidebar";
import { Topbar } from "./Topbar";

type FolderRow = {
  id: string;
  name: string;
};

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);

  const [userEmail, setUserEmail] = useState("");
  const [username, setUsername] = useState("");
  const [folders, setFolders] = useState<SidebarFolder[]>([]);
  const [pageTitle, setPageTitle] = useState("Dashboard");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const currentFolderId = useMemo(() => {
    const match = pathname.match(/^\/dashboard\/folder\/([^/]+)/);
    return match?.[1];
  }, [pathname]);

  const fetchFolders = useCallback(async () => {
    const res = await apiFetch("/api/folders");
    if (!res.ok) return;

    const data: FolderRow[] = await res.json();
    const withCounts = await Promise.all(
      data.map(async (folder) => {
        const linksRes = await apiFetch(`/api/links?folder_id=${folder.id}`);
        const links = linksRes.ok ? await linksRes.json() : [];
        return {
          id: folder.id,
          name: folder.name,
          linkCount: Array.isArray(links) ? links.length : 0,
        };
      }),
    );

    setFolders(withCounts);
  }, []);

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserEmail(user?.email ?? "");

      try {
        const profileRes = await apiFetch("/api/profiles/me");
        if (profileRes.status === 404) {
          window.location.href = "/onboarding";
          return;
        }

        if (profileRes.status === 403) {
          const body = await profileRes.json().catch(() => ({}));
          if (body.code === "PROFILE_REQUIRED") {
            window.location.href = "/onboarding";
            return;
          }
        }

        if (profileRes.ok) {
          const profile = await profileRes.json();
          setUsername(profile.username || "");
        }
      } catch (err) {
        console.error("Profile check error:", err);
      }

      setIsLoadingProfile(false);
      await fetchFolders();
    }

    init();

    const handleUpdate = () => {
      fetchFolders();
    };
    window.addEventListener("folders-updated", handleUpdate);
    return () => {
      window.removeEventListener("folders-updated", handleUpdate);
    };
  }, [fetchFolders, supabase]);

  useEffect(() => {
    async function resolveTitle() {
      if (pathname === "/dashboard") {
        const q = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("q") || "" : "";
        setPageTitle(q ? `Search: "${q}"` : "My Folders");
        return;
      }

      if (currentFolderId) {
        const res = await apiFetch(`/api/folders/${currentFolderId}`);
        if (res.ok) {
          const folder = await res.json();
          setPageTitle(folder.name ?? "Folder");
          return;
        }
        setPageTitle("Folder");
        return;
      }

      const tagMatch = pathname.match(/^\/dashboard\/tags\/([^/]+)/);
      if (tagMatch) {
        const tagId = tagMatch[1];
        const res = await apiFetch("/api/tags");
        if (res.ok) {
          const tags = await res.json();
          const tag = tags.find((t: { id: string }) => t.id === tagId);
          setPageTitle(tag ? `#${tag.name}` : "Tag");
          return;
        }
        setPageTitle("Tag");
        return;
      }

      setPageTitle("Dashboard");
    }

    resolveTitle();
  }, [pathname, currentFolderId]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function handleNewFolder() {
    const name = window.prompt("Folder name");
    if (!name?.trim()) return;

    const res = await apiFetch("/api/folders", {
      method: "POST",
      body: JSON.stringify({ name: name.trim() }),
    });

    if (res.ok) {
      await fetchFolders();
    }
  }

  const sidebarProps = {
    folders,
    currentFolderId,
    userEmail,
    userUsername: username,
    onSignOut: handleSignOut,
    onNewFolder: handleNewFolder,
    onNavigate: () => setDrawerOpen(false),
  };

  if (isLoadingProfile) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
          color: "var(--text-muted)",
          fontFamily: "sans-serif",
          fontSize: "14px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "2px solid var(--border)",
              borderTopColor: "var(--accent)",
              animation: "spin 1s linear infinite",
            }}
          />
          <span>Checking account...</span>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg)",
      }}
    >
      <div className="dashboard-sidebar-desktop">
        <Sidebar {...sidebarProps} />
      </div>

      {drawerOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="dashboard-drawer-overlay"
          onClick={() => setDrawerOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            border: "none",
            padding: 0,
            cursor: "pointer",
            zIndex: 40,
          }}
        />
      )}

      <div
        className={`dashboard-drawer ${drawerOpen ? "dashboard-drawer-open" : ""}`}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 250ms ease",
        }}
      >
        <Sidebar {...sidebarProps} />
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <Topbar
          pageTitle={pageTitle}
          userEmail={userEmail}
          onMenuClick={() => setDrawerOpen(true)}
        />
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "var(--space-6)",
          }}
        >
          {children}
        </main>
      </div>

      <style jsx global>{`
        @keyframes drawerOverlayFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .dashboard-drawer-overlay {
          animation: drawerOverlayFadeIn 200ms ease-out forwards;
        }

        @media (min-width: 768px) {
          .dashboard-sidebar-desktop {
            display: block;
            flex-shrink: 0;
          }

          .dashboard-drawer,
          .dashboard-drawer-overlay {
            display: none !important;
          }
        }

        @media (max-width: 767px) {
          .dashboard-sidebar-desktop {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
