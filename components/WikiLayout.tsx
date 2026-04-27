'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GitBranch, Home, Moon, Sun, Orbit, Footprints, Heart } from 'lucide-react';
import { useEffect, useState } from 'react';

interface WikiLayoutProps {
  children: React.ReactNode;
}

function getInitialTheme(): boolean {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem('aperture-theme');
  if (saved) return saved === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export default function WikiLayout({ children }: WikiLayoutProps) {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('aperture-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('aperture-theme', 'light');
    }
  }, [isDark]);

  const nav = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/life', label: 'Life', icon: Heart },
    { href: '/graph', label: 'Graph', icon: GitBranch },
    { href: '/clusters', label: 'Clusters', icon: Orbit },
    { href: '/walk', label: 'Walk', icon: Footprints },
  ];

  return (
    <div className="min-h-dvh bg-background text-foreground transition-colors duration-300">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-serif text-lg font-medium tracking-tight rounded-md focus-ring"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-sans">
              A
            </span>
            <span>Aperture</span>
          </Link>

          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-1">
              {nav.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.97] focus-ring ${
                      active
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={() => setIsDark(!isDark)}
              className="ml-1 flex h-8 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground focus-ring"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-10 text-center text-sm text-muted-foreground">
        <div className="mx-auto max-w-7xl px-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Powered by{' '}
            <a
              href="https://github.com/ZepPellN/aperture"
              className="underline underline-offset-2 hover:text-foreground transition-colors duration-200 rounded focus-ring"
              target="_blank"
              rel="noreferrer"
            >
              Aperture
            </a>
          </p>
          <nav className="flex items-center justify-center gap-4">
            <Link href="/" className="hover:text-foreground transition-colors duration-200 rounded focus-ring">
              Home
            </Link>
            <Link href="/life" className="hover:text-foreground transition-colors duration-200 rounded focus-ring">
              Life
            </Link>
            <Link href="/graph" className="hover:text-foreground transition-colors duration-200 rounded focus-ring">
              Graph
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
