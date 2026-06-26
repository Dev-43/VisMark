'use client';

import { useState } from 'react';
import { ArrowRight, Play, Layout, Folder, Loader2 } from 'lucide-react';
import { HowItWorks } from './HowItWorks';
import { FeaturesGrid } from './FeaturesGrid';

export default function Page() {
  const [activeTab, setActiveTab] = useState<'demo' | 'dashboard' | 'folders'>('dashboard');
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', src: '/screenshots/dashboard.png', icon: Layout },
    { id: 'demo' as const, label: 'Interactive Demo', src: '/screenshots/demo.gif', icon: Play },
    { id: 'folders' as const, label: 'Folder View', src: '/screenshots/folder-view.png', icon: Folder },
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="w-full overflow-x-hidden bg-[var(--bg)] text-[var(--text)]">
      {/* Hero Section */}
      <section className="relative min-h-screen w-full flex flex-col items-center justify-center px-4 pt-32 pb-16"
        style={{
          background: `radial-gradient(circle at 50% 0%, var(--accent-subtle), var(--bg))`,
        }}
      >
        <div className="w-full max-w-4xl flex flex-col items-center text-center">
          {/* Eyebrow Label */}
          <div
            className="inline-flex items-center rounded-full px-3 py-1 mb-8 text-sm font-medium"
            style={{
              backgroundColor: 'var(--accent-subtle)',
              color: 'var(--accent)',
            }}
          >
            Visual Bookmark Manager
          </div>

          {/* Main Headline */}
          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 tracking-tight"
            style={{ color: 'var(--text)' }}
          >
            Your bookmarks,{' '}
            <span
              style={{
                color: 'var(--accent)',
                textDecoration: 'underline',
                textDecorationColor: 'var(--accent)',
                textDecorationStyle: 'wavy',
                textUnderlineOffset: '8px',
              }}
            >
              finally visual
            </span>
            .
          </h1>

          {/* Subheadline */}
          <p
            className="text-lg md:text-xl max-w-2xl mb-10 leading-relaxed"
            style={{ color: 'var(--text-muted)' }}
          >
            Paste any URL. We capture a screenshot automatically. Organize with
            folders, tags, and sharing.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-16">
            <button
              className="px-8 font-semibold rounded-lg transition-colors duration-150 flex items-center justify-center gap-2 h-14"
              style={{
                backgroundColor: 'var(--accent)',
                color: '#FFFFFF',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--accent-hover)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--accent)')
              }
            >
              Get Started Free
              <ArrowRight size={18} className="flex-shrink-0" />
            </button>

            <button
              className="px-8 font-semibold rounded-lg transition-colors duration-150 flex items-center justify-center h-14"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--text)',
                border: '2px solid var(--border)',
              }}
              onClick={() => scrollToSection('how-it-works')}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--surface-2)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'transparent')
              }
            >
              See how it works
            </button>
          </div>

          {/* Product Screenshot */}
          <div className="w-full max-w-5xl">
            <div
              className="relative rounded-xl overflow-hidden border"
              style={{
                boxShadow: 'var(--shadow-card)',
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
              }}
            >
              {/* Browser Window Chrome */}
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-3 border-b"
                style={{
                  backgroundColor: 'var(--surface-2)',
                  borderColor: 'var(--border)',
                }}
              >
                {/* Dots & URL Bar Mockup */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                    <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                    <div className="w-3 h-3 rounded-full bg-[#28C940]" />
                  </div>
                  {/* Mock URL bar */}
                  <div 
                    className="hidden md:block px-3 py-1.5 rounded text-xs font-mono select-all truncate max-w-xs"
                    style={{
                      backgroundColor: 'var(--surface)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    https://vismark.app/dashboard
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-neutral-200/50 dark:bg-neutral-800/50 p-1 rounded-lg gap-1 self-end sm:self-auto">
                  {tabs.map((tab) => {
                    const TabIcon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                          isActive 
                            ? 'shadow-sm' 
                            : 'hover:text-[var(--text)] text-[var(--text-muted)]'
                        }`}
                        style={{
                          backgroundColor: isActive ? 'var(--surface)' : 'transparent',
                          color: isActive ? 'var(--text)' : 'inherit',
                        }}
                      >
                        <TabIcon size={14} className={isActive ? 'text-[var(--accent)]' : ''} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Screenshot Content */}
              <div className="relative bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 aspect-video flex items-center justify-center min-h-[450px] overflow-hidden">
                {tabs.map((tab) => {
                  const isCurrent = activeTab === tab.id;
                  const isLoaded = loadedImages[tab.id];
                  
                  if (!isCurrent && !isLoaded) return null;
                  
                  return (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      key={tab.id}
                      src={tab.src}
                      alt={tab.label}
                      className={`w-full h-full object-cover transition-opacity duration-300 absolute inset-0 ${
                        isCurrent && isLoaded ? 'opacity-100' : 'opacity-0 pointer-events-none'
                      }`}
                      onLoad={() => {
                        setLoadedImages(prev => ({ ...prev, [tab.id]: true }));
                      }}
                      onError={() => {
                        console.error(`Failed to load preview image: ${tab.src}`);
                      }}
                    />
                  );
                })}

                {/* Loading indicator */}
                {!loadedImages[activeTab] && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--surface)] text-[var(--text-muted)] gap-3">
                    <Loader2 className="animate-spin text-[var(--accent)]" size={32} />
                    <div className="text-sm font-medium">Loading {tabs.find(t => t.id === activeTab)?.label}...</div>
                    {activeTab === 'demo' && (
                      <div className="text-xs text-[var(--text-muted)] max-w-xs text-center px-4">
                        The interactive demo may take a few seconds to load (approx. 27MB).
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <HowItWorks />
      <FeaturesGrid />
    </main>
  );
}
