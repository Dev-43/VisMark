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
  const [folders, setFolders] = useState<SidebarFolder[]>([]);
  const [pageTitle, setPageTitle] = useState("Dashboard");
  const [drawerOpen, setDrawerOpen] = useState(false);

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
      await fetchFolders();
    }

    init();
  }, [fetchFolders, supabase]);

  useEffect(() => {
    async function resolveTitle() {
      if (pathname === "/dashboard") {
        setPageTitle("Dashboard");
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
    onSignOut: handleSignOut,
    onNewFolder: handleNewFolder,
    onNavigate: () => setDrawerOpen(false),
  };

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
