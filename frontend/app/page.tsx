'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Bookmark,
  Link2,
  Camera,
  Search,
  Tag,
  Share2,
  Zap,
  ChevronRight,
  Eye,
} from 'lucide-react';

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

export default function Page() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ backgroundColor: 'var(--bg)', color: 'var(--text)', overflowX: 'hidden' }}>
      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      {/* Navbar */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '40px',
          paddingRight: '40px',
          backgroundColor: isScrolled ? 'var(--bg)' : 'transparent',
          borderBottom: isScrolled ? '1px solid var(--border)' : 'none',
          transition: 'all 150ms ease',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Bookmark size={24} color="var(--accent)" />
          <span
            style={{
              fontSize: '18px',
              fontWeight: 600,
              letterSpacing: '0.02em',
              color: 'var(--text)',
            }}
          >
            VisMark
          </span>
        </div>

        {/* Right nav items */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <ThemeToggle />
          <Link href="/login">
            <button
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--bg)',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent)';
              }}
            >
              Login
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '120px 40px 80px 40px',
          gap: '60px',
          width: '100%',
          maxWidth: '100vw',
          background: 'radial-gradient(circle at 75% 30%, var(--accent-subtle), transparent 60%)',
        }}
      >
        {/* Left side */}
        <div style={{ 
          flex: '0 0 55%',
          animation: 'fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both'
        }}>
          <div
            style={{
              fontSize: '13px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '24px',
            }}
          >
            Visual Bookmark Manager
          </div>

          <h1
            style={{
              fontSize: '80px',
              fontWeight: 800,
              lineHeight: 1.05,
              color: 'var(--text)',
              marginBottom: '24px',
            }}
          >
            Save links.
            <br />
            <span style={{ color: 'var(--accent)' }}>Remember</span>
            <br />
            everything.
          </h1>

          <p
            style={{
              fontSize: '18px',
              color: 'var(--text-muted)',
              maxWidth: '420px',
              lineHeight: 1.6,
              marginBottom: '40px',
            }}
          >
            Paste any URL and VisMark captures a screenshot automatically. No
            more forgetting what you saved.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <Link href="/login">
              <button
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--bg)',
                  border: 'none',
                  height: '48px',
                  paddingLeft: '24px',
                  paddingRight: '24px',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent)';
                }}
              >
                Login <ChevronRight size={18} />
              </button>
            </Link>

            <button
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '15px',
                cursor: 'pointer',
                padding: '0',
                transition: 'all 150ms ease',
              }}
              onClick={() =>
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
              }
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text)';
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              See how it works
            </button>
          </div>
        </div>

        {/* Right side - Browser mockup */}
        <div style={{ 
          flex: '0 0 45%', 
          overflow: 'hidden',
          animation: 'fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both'
        }}>
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
              backgroundColor: 'var(--surface-2)',
              width: '100%',
              maxWidth: '680px',
              transition: 'transform 300ms ease, box-shadow 300ms ease',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)';
              e.currentTarget.style.boxShadow = '0 40px 80px rgba(0,0,0,0.7)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 32px 64px rgba(0,0,0,0.6)';
            }}
          >
            {/* Browser top bar */}
            <div
              style={{
                height: '32px',
                backgroundColor: 'var(--surface-2)',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '12px',
                gap: '8px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--error)',
                }}
              />
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--warning)',
                }}
              />
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--success)',
                }}
              />
            </div>

            {/* URL bar area */}
            <div
              style={{
                height: '32px',
                backgroundColor: 'var(--bg)',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '16px',
                borderBottom: '1px solid var(--border)',
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}
            >
              vis-mark-two.vercel.app
            </div>

            {/* Content area */}
            <div
              style={{
                backgroundColor: 'var(--bg)',
                minHeight: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                fontSize: '14px',
                padding: '32px',
                textAlign: 'center',
              }}
            >
              <Image
                src="/screenshots/folder-view.webp"
                alt="VisMark folder view showing visual link cards"
                width={1280}
                height={800}
                priority
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        style={{
          padding: '120px 40px',
          backgroundColor: 'var(--bg)',
        }}
      >
        <h2
          style={{
            fontSize: '48px',
            fontWeight: 700,
            marginBottom: '80px',
            color: 'var(--text)',
          }}
        >
          How it works
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '32px',
          }}
        >
          {/* Step 1 */}
          <div>
            <div
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '32px',
                transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer',
                height: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--border)',
                  fontWeight: 600,
                  marginBottom: '16px',
                }}
              >
                01
              </div>
              <Link2 size={24} color="var(--text)" style={{ marginBottom: '16px' }} />
              <h3
                style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: 'var(--text)',
                  marginBottom: '12px',
                }}
              >
                Paste a URL
              </h3>
              <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
                Copy any link and paste it into a folder.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div>
            <div
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '32px',
                transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer',
                height: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--border)',
                  fontWeight: 600,
                  marginBottom: '16px',
                }}
              >
                02
              </div>
              <Camera size={24} color="var(--text)" style={{ marginBottom: '16px' }} />
              <h3
                style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: 'var(--text)',
                  marginBottom: '12px',
                }}
              >
                We capture a screenshot
              </h3>
              <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
                A real screenshot of the page is taken automatically in the
                background.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div>
            <div
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '32px',
                transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer',
                height: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--border)',
                  fontWeight: 600,
                  marginBottom: '16px',
                }}
              >
                03
              </div>
              <Bookmark size={24} color="var(--text)" style={{ marginBottom: '16px' }} />
              <h3
                style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: 'var(--text)',
                  marginBottom: '12px',
                }}
              >
                Organize and find anything
              </h3>
              <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
                Use folders, tags, and search to keep everything findable.
              </p>
            </div>
          </div>
        </div>

        {/* Demo Video */}
        <div style={{
          marginTop: '80px',
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          maxWidth: '1100px',
          marginLeft: 'auto',
          marginRight: 'auto',
          transition: 'transform 300ms ease, box-shadow 300ms ease',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px) scale(1.005)';
          e.currentTarget.style.boxShadow = '0 40px 96px rgba(0,0,0,0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '0 32px 80px rgba(0,0,0,0.5)';
        }}
        >
          {/* Browser chrome bar */}
          <div style={{
            background: 'var(--surface-2)',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', 
              background: 'var(--error)' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', 
              background: 'var(--warning)' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', 
              background: 'var(--success)' }} />
            <span style={{ 
              marginLeft: '12px', 
              fontSize: '12px', 
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono, monospace)'
            }}>
              vis-mark-two.vercel.app/dashboard
            </span>
          </div>
          {/* Video */}
          <video
            autoPlay
            loop
            muted
            playsInline
            style={{ width: '100%', display: 'block' }}
          >
            <source src="/screenshots/demo.mp4" type="video/mp4" />
            {/* Fallback if no video */}
            <Image
              src="/screenshots/folder-view.webp"
              alt="VisMark dashboard demo"
              width={1280}
              height={800}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </video>
        </div>
      </section>

      {/* Features Section */}
      <section
        style={{
          padding: '120px 40px',
          backgroundColor: 'var(--bg)',
          borderTop: '1px solid var(--border)',
        }}
      >
        <h2
          style={{
            fontSize: '48px',
            fontWeight: 700,
            marginBottom: '80px',
            color: 'var(--text)',
            maxWidth: '600px',
          }}
        >
          Built for people who actually save links
        </h2>

        {/* Full-width feature */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '60px',
            marginBottom: '80px',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ marginBottom: '20px' }}>
              <Eye size={24} color="var(--text)" style={{ marginBottom: '20px' }} />
            </div>
            <h3
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--text)',
                marginBottom: '16px',
              }}
            >
              Visual bookmarks, not just URLs
            </h3>
            <p
              style={{
                fontSize: '16px',
                color: 'var(--text-muted)',
                maxWidth: '480px',
                lineHeight: 1.6,
              }}
            >
              Every saved link gets a screenshot card automatically. See exactly
              what you saved, not just a URL.
            </p>
          </div>
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
              backgroundColor: 'var(--surface-2)',
              width: '100%',
              transition: 'transform 300ms ease, box-shadow 300ms ease',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)';
              e.currentTarget.style.boxShadow = '0 40px 80px rgba(0,0,0,0.7)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 32px 64px rgba(0,0,0,0.6)';
            }}
          >
            {/* Browser top bar */}
            <div
              style={{
                height: '32px',
                backgroundColor: 'var(--surface-2)',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '12px',
                gap: '8px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--error)',
                }}
              />
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--warning)',
                }}
              />
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--success)',
                }}
              />
            </div>

            {/* URL bar area */}
            <div
              style={{
                height: '32px',
                backgroundColor: 'var(--bg)',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '16px',
                borderBottom: '1px solid var(--border)',
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}
            >
              vis-mark-two.vercel.app/dashboard
            </div>

            {/* Content area */}
            <div
              style={{
                backgroundColor: 'var(--bg)',
                display: 'block',
              }}
            >
              <Image
                src="/screenshots/dashboard.webp"
                alt="VisMark dashboard showing folder grid"
                width={1280}
                height={800}
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  display: 'block',
                }}
              />
            </div>
          </div>
        </div>

        {/* 2-column feature grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '60px 40px',
          }}
        >
          {/* Feature 2 */}
          <div>
            <Search size={20} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
            <h4
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--text)',
                marginBottom: '8px',
              }}
            >
              Full-text search
            </h4>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Search titles, URLs, and descriptions instantly.
            </p>
          </div>

          {/* Feature 3 */}
          <div>
            <Tag size={20} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
            <h4
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--text)',
                marginBottom: '8px',
              }}
            >
              Folders & tags
            </h4>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Organize links the way your brain works.
            </p>
          </div>

          {/* Feature 4 */}
          <div>
            <Share2 size={20} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
            <h4
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--text)',
                marginBottom: '8px',
              }}
            >
              Public sharing
            </h4>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Share any folder as a public link. No login needed to view.
            </p>
          </div>

          {/* Feature 5 */}
          <div>
            <Zap size={20} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
            <h4
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--text)',
                marginBottom: '8px',
              }}
            >
              Background processing
            </h4>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Screenshots process async. The UI never waits.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section
        style={{
          padding: '120px 40px',
          backgroundColor: 'var(--bg)',
          borderTop: '1px solid var(--border)',
        }}
      >
        <h2
          style={{
            fontSize: '64px',
            fontWeight: 700,
            color: 'var(--text)',
            marginBottom: '40px',
            maxWidth: '600px',
            lineHeight: 1.2,
          }}
        >
          Start saving links visually.
        </h2>

        <Link href="/login">
          <button
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--bg)',
              border: 'none',
              height: '48px',
              paddingLeft: '24px',
              paddingRight: '24px',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent)';
            }}
          >
            Login with Google <ChevronRight size={18} />
          </button>
        </Link>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
        </p>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          padding: '40px',
          backgroundColor: 'var(--bg)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Bookmark size={16} color="var(--accent)" />
            <span
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--text)',
              }}
            >
              VisMark
            </span>
          </div>
          <span
            style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              marginLeft: '16px',
            }}
          >
            © 2026
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a
            href="https://github.com/Dev-43/VisMark"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              textDecoration: 'none',
              transition: 'color 150ms ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <Github size={16} />
            Source
          </a>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Built by Devesh with Next.js · Supabase · Railway
          </span>
        </div>
      </footer>
    </div>
  );
}
