"use client";

import { Bookmark } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";
import { createClient } from "@/lib/supabase";

// ── CSS vars + animations injected once ────────────────────────────────────
const CSS = `
  /* dot-grid texture */
  .vm-dot-grid {
    background-image: radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px);
    background-size: 22px 22px;
  }

  /* floating card keyframes */
  @keyframes vm-float-a {
    0%,100% { transform: translateY(0px)  rotate(-2deg);   }
    50%      { transform: translateY(-9px) rotate(-2deg);   }
  }
  @keyframes vm-float-b {
    0%,100% { transform: translateY(0px)  rotate(1.5deg);  }
    50%      { transform: translateY(-7px) rotate(1.5deg);  }
  }
  @keyframes vm-float-c {
    0%,100% { transform: translateY(0px)   rotate(-1deg);  }
    50%      { transform: translateY(-11px) rotate(-1deg);  }
  }
  .vm-float-a { animation: vm-float-a 4.2s ease-in-out infinite; }
  .vm-float-b { animation: vm-float-b 5.0s ease-in-out infinite 0.8s; }
  .vm-float-c { animation: vm-float-c 3.8s ease-in-out infinite 1.6s; }

  /* Google button hover */
  .vm-google-btn {
    transition: transform 150ms ease, box-shadow 150ms ease;
    cursor: pointer;
  }
  .vm-google-btn:hover  { transform: translateY(-2px); box-shadow: var(--shadow-hover); }
  .vm-google-btn:active { transform: translateY(0);    }

  /* theme toggle hover */
  .vm-toggle {
    transition: background 150ms ease, color 150ms ease;
  }
  .vm-toggle:hover { background: var(--accent-subtle); color: var(--accent); }

  /* ── responsive ── */
  @media (max-width: 767px) {
    .vm-layout { flex-direction: column !important; }

    .vm-left {
      flex: none !important;
      padding: 36px 24px 30px !important;
    }
    /* hide floating cards on mobile */
    .vm-cards { display: none !important; }
    /* remove bottom margin from wordmark on mobile */
    .vm-wordmark { margin-bottom: 0 !important; }

    .vm-right {
      flex: 1 !important;
      padding: 40px 24px !important;
    }
  }
`;

// ── Floating link-card mockup ───────────────────────────────────────────────
interface CardProps {
  title: string;
  domain: string;
  gradient: string;
  emoji: string;
  floatClass: string;
  style?: React.CSSProperties;
}
function LinkCard({ title, domain, gradient, emoji, floatClass, style }: CardProps) {
  return (
    <div
      className={floatClass}
      style={{
        position: "absolute",
        width: 196,
        background: "rgba(255,255,255,0.10)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: 14,
        padding: "12px 12px 10px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.20)",
        ...style,
      }}
    >
      {/* thumbnail */}
      <div
        style={{
          height: 86,
          borderRadius: 8,
          background: gradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "2rem",
          marginBottom: 9,
        }}
        aria-hidden="true"
      >
        {emoji}
      </div>
      <p
        style={{
          color: "#fff",
          fontSize: 12.5,
          fontWeight: 600,
          lineHeight: 1.35,
          marginBottom: 4,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {title}
      </p>
      <p style={{ color: "rgba(255,255,255,0.50)", fontSize: 11 }}>{domain}</p>
    </div>
  );
}

// ── Google "G" SVG ──────────────────────────────────────────────────────────
function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.1-6.1C34.46 3.08 29.53 1 24 1 14.82 1 7.07 6.48 3.64 14.22l7.11 5.52C12.49 13.48 17.79 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.52 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.7c-.55 2.97-2.2 5.48-4.67 7.17l7.19 5.59C43.44 37.3 46.52 31.36 46.52 24.5z"/>
      <path fill="#FBBC05" d="M10.75 28.26A14.52 14.52 0 0 1 9.5 24c0-1.48.26-2.91.72-4.26L3.11 14.22A23.94 23.94 0 0 0 0 24c0 3.82.92 7.43 2.54 10.62l8.21-6.36z"/>
      <path fill="#34A853" d="M24 47c5.53 0 10.18-1.83 13.57-4.97l-7.19-5.59C28.5 37.79 26.35 38.5 24 38.5c-6.2 0-11.49-3.97-13.25-9.48l-8.21 6.36C6.07 43.52 14.43 47 24 47z"/>
    </svg>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function Page() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <main
        className="vm-layout"
        style={{
          display: "flex",
          minHeight: "100dvh",
          fontFamily: "'Satoshi','DM Sans',ui-sans-serif,system-ui,sans-serif",
        }}
      >
        {/* ═══════════════════════ LEFT PANEL ════════════════════════════ */}
        <section
          className="vm-left"
          aria-hidden="true"
          style={{
            flex: "0 0 50%",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "56px 44px",
            background: isDark ? "var(--surface-2)" : "var(--accent)",
            overflow: "hidden",
          }}
        >
          {/* dot-grid overlay */}
          <div className="vm-dot-grid" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

          {/* wordmark */}
          <div
            className="vm-wordmark"
            style={{
              position: "relative",
              zIndex: 1,
              textAlign: "center",
              marginBottom: 52,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <Bookmark
                size={30}
                strokeWidth={2.5}
                style={{ color: isDark ? "var(--accent)" : "#fff", flexShrink: 0 }}
              />
              <span
                style={{
                  fontSize: "clamp(2.2rem,3.8vw,3rem)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  color: isDark ? "var(--text)" : "#fff",
                  fontFamily: "'Clash Display','Sora','DM Sans',ui-sans-serif,sans-serif",
                }}
              >
                VisMark
              </span>
            </div>
            <p
              style={{
                fontSize: "1.05rem",
                color: isDark ? "var(--text-muted)" : "rgba(255,255,255,0.68)",
                letterSpacing: "0.01em",
                lineHeight: 1.5,
              }}
            >
              Your bookmarks, finally visual.
            </p>
          </div>

          {/* floating cards */}
          <div
            className="vm-cards"
            style={{
              position: "relative",
              zIndex: 1,
              width: "100%",
              maxWidth: 430,
              height: 270,
            }}
          >
            <LinkCard
              floatClass="vm-float-a"
              style={{ left: "0%", top: 8 }}
              title="The beauty of functional programming"
              domain="maggieappleton.com"
              gradient="linear-gradient(135deg,#667eea,#764ba2)"
              emoji="🧠"
            />
            <LinkCard
              floatClass="vm-float-b"
              style={{ right: "0%", top: 0 }}
              title="Designing better data tables"
              domain="uxdesign.cc"
              gradient="linear-gradient(135deg,#f093fb,#f5576c)"
              emoji="📊"
            />
            <LinkCard
              floatClass="vm-float-c"
              style={{ left: "50%", transform: "translateX(-50%)", top: 136 }}
              title="How Figma builds product at scale"
              domain="figma.com"
              gradient="linear-gradient(135deg,#4facfe,#00f2fe)"
              emoji="✏️"
            />
          </div>
        </section>

        {/* ═══════════════════════ RIGHT PANEL ═══════════════════════════ */}
        <section
          className="vm-right"
          style={{
            flex: "0 0 50%",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "56px 44px",
            background: "var(--bg)",
          }}
        >
          {/* theme toggle */}
          <div
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              zIndex: 10,
            }}
          >
            <ThemeToggle />
          </div>

          {/* sign-in card */}
          <div style={{ width: "100%", maxWidth: 360 }}>
            <h1
              style={{
                fontSize: "clamp(1.75rem,2.8vw,2.35rem)",
                fontWeight: 700,
                letterSpacing: "-0.025em",
                lineHeight: 1.15,
                color: "var(--text)",
                marginBottom: 8,
                fontFamily: "'Clash Display','Sora','DM Sans',ui-sans-serif,sans-serif",
              }}
            >
              Welcome back
            </h1>
            <p
              style={{
                fontSize: "0.975rem",
                color: "var(--text-muted)",
                lineHeight: 1.55,
                marginBottom: 36,
              }}
            >
              Sign in to continue to VisMark
            </p>

            {/* Google button */}
            <button
              className="vm-google-btn"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                width: "100%",
                padding: "13px 20px",
                borderRadius: 10,
                border: "1px solid #dadce0",
                background: "#ffffff",
                fontSize: 14.5,
                fontWeight: 600,
                color: "#1A1A2E",
                fontFamily: "inherit",
                boxShadow: "0 2px 6px rgba(0,0,0,0.07)",
              }}
              onClick={handleGoogleLogin}
            >
              <GoogleG />
              Continue with Google
            </button>

            {/* fine print */}
            <p
              style={{
                marginTop: 18,
                fontSize: 12,
                color: "var(--text-muted)",
                textAlign: "center",
                lineHeight: 1.65,
              }}
            >
              No account needed — signing in creates one automatically.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
