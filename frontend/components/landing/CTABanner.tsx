"use client";

import Link from "next/link";

export function CTABanner() {
  return (
    <>
      <section className="cta-banner" id="cta">
        <div className="cta-container">
          <h2 className="cta-heading">Start saving links visually.</h2>
          <p className="cta-subheading">It's free. No credit card required.</p>
          <Link href="/login" className="cta-btn">
            <svg
              className="google-icon"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>Get Started with Google</span>
          </Link>
        </div>
      </section>

      <style jsx>{`
        .cta-banner {
          background-color: var(--accent);
          padding: 80px 0;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          border-top: 1px solid transparent;
          transition: background-color var(--transition), border-color var(--transition);
        }

        :global([data-theme="dark"]) .cta-banner {
          background-color: var(--surface-2);
          border-top: 1px solid var(--accent);
        }

        .cta-container {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          padding: 0 var(--space-6);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .cta-heading {
          font-family: var(--font-display);
          font-size: clamp(32px, 5vw, 40px);
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 12px 0;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        :global([data-theme="dark"]) .cta-heading {
          color: var(--text);
        }

        .cta-subheading {
          font-family: var(--font-body);
          font-size: clamp(16px, 2.5vw, 18px);
          font-weight: 450;
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 32px 0;
          line-height: 1.5;
        }

        :global([data-theme="dark"]) .cta-subheading {
          color: var(--text-muted);
        }

        .cta-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          height: 56px;
          padding: 0 32px;
          background-color: #ffffff;
          color: var(--accent);
          font-family: var(--font-body);
          font-size: 16px;
          font-weight: 600;
          border-radius: var(--radius-md);
          text-decoration: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transition: transform var(--transition), box-shadow var(--transition), background-color var(--transition);
        }

        .cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          background-color: #fcfcfc;
        }

        :global([data-theme="dark"]) .cta-btn:hover {
          box-shadow: var(--shadow-hover);
          background-color: #ffffff;
        }

        .cta-btn:active {
          transform: translateY(0);
        }

        .google-icon {
          flex-shrink: 0;
        }
      `}</style>
    </>
  );
}
