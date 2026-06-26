"use client";

import Link from "next/link";
import { Bookmark } from "lucide-react";

interface GithubProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

function Github({ size = 24, ...props }: GithubProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export function Footer() {
  return (
    <>
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-top">
            {/* Left: Logo & Tagline */}
            <div className="footer-left">
              <Link href="/" className="footer-logo">
                <Bookmark
                  size={20}
                  style={{ color: "var(--accent)", flexShrink: 0 }}
                  aria-hidden
                />
                <span>VisMark</span>
              </Link>
              <span className="footer-tagline">A visual bookmark manager</span>
            </div>

            {/* Right: Links & Tech Stack */}
            <div className="footer-right">
              <a
                href="https://github.com/Dev-43/VisMark"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                <Github size={16} />
                <span>Source</span>
              </a>
              <span className="footer-built-with">
                Built with Next.js, Supabase & Railway
              </span>
            </div>
          </div>

          <div className="footer-divider" />

          {/* Bottom Row */}
          <div className="footer-bottom">
            <span>© 2026 VisMark. Built by Dev-43.</span>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .footer {
          background-color: var(--surface-2);
          border-top: 1px solid var(--border);
          padding: 48px 0;
          color: var(--text);
          font-family: var(--font-body);
        }

        .footer-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 var(--space-6);
        }

        .footer-top {
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-bottom: 32px;
        }

        @media (min-width: 768px) {
          .footer-top {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }

        .footer-left {
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-items: flex-start;
        }

        @media (max-width: 767px) {
          .footer-left {
            align-items: center;
            text-align: center;
          }
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 600;
          color: var(--text);
          text-decoration: none;
        }

        .footer-tagline {
          font-family: var(--font-body);
          font-size: 13px;
          color: var(--text-muted);
        }

        .footer-right {
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: flex-start;
        }

        @media (max-width: 767px) {
          .footer-right {
            align-items: center;
            text-align: center;
          }
        }

        @media (min-width: 640px) {
          .footer-right {
            flex-direction: row;
            align-items: center;
            gap: 24px;
          }
        }

        .footer-link {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-body);
          font-size: 13px;
          color: var(--text-muted);
          text-decoration: none;
          transition: color var(--transition);
        }

        .footer-link:hover {
          color: var(--text);
        }

        .footer-built-with {
          font-family: var(--font-body);
          font-size: 12px;
          color: var(--text-muted);
        }

        .footer-divider {
          height: 1px;
          background-color: var(--border);
          width: 100%;
          margin-bottom: 24px;
        }

        .footer-bottom {
          text-align: center;
          font-family: var(--font-body);
          font-size: 12px;
          color: var(--text-muted);
        }
      `}</style>
    </>
  );
}
