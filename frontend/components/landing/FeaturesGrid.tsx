"use client";

import { Image, ShieldCheck, Tag, Search, Share2, Zap } from "lucide-react";

export function FeaturesGrid() {
  const features = [
    {
      icon: Image,
      title: "Visual Bookmarks",
      description: "Every saved link generates a screenshot card automatically.",
    },
    {
      icon: ShieldCheck,
      title: "Smart Fallback",
      description: "If a screenshot fails, we fall back to OG image, favicon, or a clean domain card.",
    },
    {
      icon: Tag,
      title: "Folders & Tags",
      description: "Organize links into folders and tag them for instant filtering.",
    },
    {
      icon: Search,
      title: "Full-text Search",
      description: "Search across titles, URLs, and descriptions across all your folders.",
    },
    {
      icon: Share2,
      title: "Public Sharing",
      description: "Share any folder with a public link. No login required to view.",
    },
    {
      icon: Zap,
      title: "Background Processing",
      description: "Screenshots are processed in a background queue. The app never blocks or freezes.",
    },
  ];

  return (
    <>
      <section
        id="features"
        style={{
          padding: "96px 0",
          backgroundColor: "var(--bg)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 var(--space-6)",
          }}
        >
          {/* Section Header */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "64px",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "14px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--accent)",
                display: "block",
                marginBottom: "12px",
              }}
            >
              Features
            </span>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(28px, 4vw, 36px)",
                fontWeight: 700,
                color: "var(--text)",
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              Everything you need
            </h2>
          </div>

          {/* Grid Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;

              return (
                <div key={idx} className="feature-card">
                  {/* Icon Wrapper */}
                  <div
                    style={{
                      color: "var(--accent)",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                    }}
                  >
                    <Icon size={28} strokeWidth={1.5} />
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "17px",
                      fontWeight: 600,
                      color: "var(--text)",
                      margin: 0,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "14px",
                      lineHeight: 1.6,
                      color: "var(--text-muted)",
                      marginTop: "8px",
                      marginBottom: 0,
                    }}
                  >
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <style jsx>{`
        .feature-card {
          background-color: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 24px;
          transition: border-color var(--transition);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .feature-card:hover {
          border-color: color-mix(in srgb, var(--accent) 40%, transparent);
        }
      `}</style>
    </>
  );
}
