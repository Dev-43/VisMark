"use client";

import { Link2, Camera, FolderOpen } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: Link2,
      title: "Paste a URL",
      description: "Copy any URL and paste it into a folder.",
    },
    {
      number: "02",
      icon: Camera,
      title: "We capture a screenshot",
      description: "Our service automatically captures a visual preview of the page.",
    },
    {
      number: "03",
      icon: FolderOpen,
      title: "Organize and share",
      description: "Tag links, search across all bookmarks, and share folders publicly.",
    },
  ];

  return (
    <section
      id="how-it-works"
      style={{
        padding: "96px 0",
        backgroundColor: "var(--surface-2)",
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
            How it works
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
            Three steps to better bookmarks
          </h2>
        </div>

        {/* Steps Container */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-12 lg:gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === steps.length - 1;

            return (
              <div
                key={step.number}
                className="flex flex-col lg:flex-row flex-1 items-start"
              >
                {/* Step Item */}
                <div
                  className="flex flex-col flex-1"
                  style={{
                    maxWidth: "320px",
                  }}
                >
                  {/* Step Number */}
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--text-muted)",
                      marginBottom: "12px",
                    }}
                  >
                    {step.number}
                  </span>

                  {/* Icon */}
                  <div
                    style={{
                      color: "var(--accent)",
                      marginBottom: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      width: "40px",
                      height: "40px",
                    }}
                  >
                    <Icon size={40} strokeWidth={1.5} />
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "20px",
                      fontWeight: 600,
                      color: "var(--text)",
                      marginBottom: "8px",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "14px",
                      lineHeight: 1.6,
                      color: "var(--text-muted)",
                      margin: 0,
                    }}
                  >
                    {step.description}
                  </p>
                </div>

                {/* Dashed Connector Line */}
                {!isLast && (
                  <div
                    className="hidden lg:block"
                    style={{
                      flex: 1,
                      height: "2px",
                      borderBottom: "2px dashed var(--border)",
                      marginTop: "51px", // Centered relative to 40px icon (18px font-height + 12px margin + 20px half-icon-height)
                      marginLeft: "24px",
                      marginRight: "24px",
                      position: "relative",
                    }}
                  >
                    {/* Arrow Head */}
                    <div
                      style={{
                        position: "absolute",
                        right: "0px",
                        top: "-4px",
                        width: "8px",
                        height: "8px",
                        borderRight: "2px solid var(--border)",
                        borderTop: "2px solid var(--border)",
                        transform: "rotate(45deg)",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
