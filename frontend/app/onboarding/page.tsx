"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";

export default function OnboardingPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Validate formatting locally first
  const validateFormat = (val: string) => {
    if (!val) return "Username is required";
    if (val.length < 3) return "Must be at least 3 characters";
    if (val.length > 20) return "Must be at most 20 characters";
    if (!/^[a-z0-9_]+$/.test(val)) {
      return "Only lowercase letters, numbers, and underscores allowed";
    }
    return null;
  };

  // Perform availability check
  const checkAvailability = async (name: string) => {
    try {
      const res = await apiFetch(`/api/profiles/check-availability?username=${encodeURIComponent(name)}`);
      if (res.ok) {
        const data = await res.json();
        setAvailable(data.available);
        if (!data.available) {
          setValidationError(data.reason === "format" 
            ? "Invalid format" 
            : data.reason === "length" 
            ? "Invalid length" 
            : "Username is already taken"
          );
        } else {
          setValidationError(null);
        }
      } else {
        setAvailable(null);
      }
    } catch (err) {
      console.error(err);
      setAvailable(null);
    } finally {
      setChecking(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim().toLowerCase();
    setUsername(value);
    setAvailable(null);
    setErrorMsg(null);

    // Cancel existing debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    const localErr = validateFormat(value);
    if (localErr) {
      setValidationError(localErr);
      setChecking(false);
      return;
    }

    setValidationError(null);
    setChecking(true);

    // Debounce backend query
    debounceTimeoutRef.current = setTimeout(() => {
      checkAvailability(value);
    }, 300);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const localErr = validateFormat(username);
    if (localErr) {
      setValidationError(localErr);
      return;
    }

    if (available === false) {
      setValidationError("Username is already taken");
      return;
    }

    setSubmitting(true);

    try {
      const res = await apiFetch("/api/profiles", {
        method: "POST",
        body: JSON.stringify({ username }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || "Failed to save username. Please try again.");
      } else {
        // Force full page reload/transition so DashboardLayout detects the new profile
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  // Check if they already have a profile and don't need onboarding
  useEffect(() => {
    let active = true;
    async function checkExistingProfile() {
      try {
        const res = await apiFetch("/api/profiles/me");
        if (res.ok && active) {
          router.replace("/dashboard");
        }
      } catch (e) {
        console.error("Failed checking existing profile on onboarding page:", e);
      }
    }
    checkExistingProfile();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        background: "var(--bg)",
        fontFamily: "'Satoshi','DM Sans',ui-sans-serif,system-ui,sans-serif",
      }}
    >
      {/* Theme toggle in top right */}
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

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: isDark ? "var(--surface-2)" : "#ffffff",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "40px 32px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
          }}
        >
          {/* Logo & title */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 32,
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "var(--accent-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Bookmark size={24} color="var(--accent)" />
            </div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: 8,
                fontFamily: "'Clash Display','Sora','DM Sans',ui-sans-serif,sans-serif",
              }}
            >
              Choose your username
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "var(--text-muted)",
                lineHeight: 1.5,
                maxWidth: "280px",
              }}
            >
              This is how other users will find and invite you to collaborate.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Input field */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label
                htmlFor="username"
                style={{
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: "var(--text)",
                  letterSpacing: "0.02em",
                }}
              >
                Username
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                    fontSize: "14.5px",
                    fontWeight: 500,
                  }}
                >
                  vismark.to/
                </span>
                <input
                  id="username"
                  type="text"
                  placeholder="alex_smith"
                  value={username}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "12px 40px 12px 90px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: isDark ? "rgba(0,0,0,0.1)" : "#fafafa",
                    color: "var(--text)",
                    fontSize: "14.5px",
                    fontFamily: "inherit",
                    fontWeight: 500,
                    outline: "none",
                    transition: "border-color 150ms ease",
                  }}
                  disabled={submitting}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />

                {/* Status Indicator inside Input */}
                <div
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {checking && <Loader2 size={18} className="animate-spin" style={{ color: "var(--accent)" }} />}
                  {!checking && available === true && !validationError && (
                    <CheckCircle2 size={18} style={{ color: "var(--success)" }} />
                  )}
                  {!checking && (available === false || validationError) && username && (
                    <XCircle size={18} style={{ color: "var(--error)" }} />
                  )}
                </div>
              </div>

              {/* Error/Success helper texts */}
              {validationError && (
                <span style={{ fontSize: "12px", color: "var(--error)", fontWeight: 500 }}>
                  {validationError}
                </span>
              )}
              {!checking && available === true && !validationError && username && (
                <span style={{ fontSize: "12px", color: "var(--success)", fontWeight: 500 }}>
                  @{username} is available!
                </span>
              )}
            </div>

            {/* Error banner from backend */}
            {errorMsg && (
              <div
                style={{
                  padding: "12px",
                  borderRadius: 8,
                  background: "var(--error-subtle, rgba(239, 68, 68, 0.1))",
                  border: "1px solid var(--error, rgb(239, 68, 68))",
                  color: "var(--error, rgb(239, 68, 68))",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting || checking || available !== true || !!validationError}
              style={{
                width: "100%",
                padding: "13px 20px",
                borderRadius: 10,
                border: "none",
                background: "var(--accent)",
                color: "var(--bg)",
                fontSize: "14.5px",
                fontWeight: 700,
                cursor: submitting || checking || available !== true || !!validationError ? "not-allowed" : "pointer",
                opacity: submitting || checking || available !== true || !!validationError ? 0.65 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "transform 150ms ease, background 150ms ease",
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Complete Onboarding"
              )}
            </button>
          </form>
        </div>
      </div>

      <style jsx global>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </main>
  );
}
