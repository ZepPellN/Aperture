'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GitBranch, Home, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

interface WikiLayoutProps {
  children: React.ReactNode;
}

export default function WikiLayout({ children }: WikiLayoutProps) {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  const nav = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/graph', label: 'Graph', icon: GitBranch },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-serif text-lg font-medium tracking-tight"
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
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all active:scale-95 ${
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
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        <p>
          Powered by{' '}
          <a
            href="https://github.com/ZepPellN/aperture"
            className="underline underline-offset-2 hover:text-foreground"
            target="_blank"
            rel="noreferrer"
          >
            Aperture
          </a>
        </p>
      </footer>
    </div>
  );
}
