"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    // Run initially to set correct state if scrolled on load
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <header
        className={`vismark-navbar ${isScrolled ? "scrolled" : ""}`}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          width: "100%",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          transition: "background var(--transition), backdrop-filter var(--transition), border-color var(--transition)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1200px",
            height: "100%",
            padding: "0 var(--space-6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Left: Logo */}
          <Link
            href="/"
            className="navbar-logo"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              textDecoration: "none",
              fontSize: "20px",
              fontWeight: 600,
              fontFamily: "var(--font-display)",
              color: "var(--text)",
            }}
          >
            <Bookmark
              size={22}
              style={{ color: "var(--accent)", flexShrink: 0 }}
              aria-hidden
            />
            <span className="font-display">VisMark</span>
          </Link>

          {/* Right: Actions */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-4)",
            }}
          >
            <ThemeToggle />
            <Link
              href="/login"
              className="signin-btn"
              style={{
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 500,
                padding: "8px 16px",
                borderRadius: "var(--radius-md)",
                transition: "color var(--transition), background var(--transition)",
              }}
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="get-started-btn"
              style={{
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 600,
                backgroundColor: "var(--accent)",
                color: "#ffffff",
                borderRadius: "var(--radius-md)",
                padding: "8px 18px",
                transition: "background-color var(--transition), transform var(--transition)",
              }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <style jsx global>{`
        /* Initial transparent state */
        .vismark-navbar {
          background: transparent;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
          border-bottom: 1px solid transparent;
        }

        /* Scrolled state */
        .vismark-navbar.scrolled {
          background: var(--surface); /* Fallback */
          background: color-mix(in srgb, var(--surface) 80%, transparent);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
        }

        /* Sign in button styles */
        .signin-btn {
          background: transparent;
          color: var(--text-muted);
        }

        .signin-btn:hover {
          color: var(--text);
        }

        /* Get started button styles */
        .get-started-btn:hover {
          background-color: var(--accent-hover) !important;
          transform: translateY(-1px);
        }

        .get-started-btn:active {
          transform: translateY(0);
        }

        /* Mobile styling */
        @media (max-width: 639px) {
          .signin-btn {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
