'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, GitBranch, Home, BookOpen, BarChart2 } from 'lucide-react';

interface WikiLayoutProps {
  children: React.ReactNode;
}

export default function WikiLayout({ children }: WikiLayoutProps) {
  const pathname = usePathname();

  const nav = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/graph', label: 'Graph', icon: GitBranch },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white text-sm">L</span>
            <span>Loom</span>
          </Link>

          <nav className="flex items-center gap-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    active
                      ? 'bg-zinc-100 text-zinc-900'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-8 text-center text-sm text-zinc-500">
        <p>
          Powered by{' '}
          <a
            href="https://github.com/ZepPellN/loom"
            className="underline hover:text-zinc-800"
            target="_blank"
            rel="noreferrer"
          >
            Loom
          </a>
        </p>
      </footer>
    </div>
  );
}
