import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://github.com/ZepPellN/Aperture';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Aperture — Browse your LLM-compiled wiki",
    template: "%s — Aperture",
  },
  description: "A web reader for LLM-compiled personal wikis. Turn raw notes into a browsable knowledge graph with source provenance, semantic trails, and agent APIs.",
  authors: [{ name: "Aperture", url: "https://github.com/ZepPellN/Aperture" }],
  keywords: ["wiki", "llm", "knowledge base", "markdown", "personal wiki", "agent-native"],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Aperture",
    title: "Aperture — Browse your LLM-compiled wiki",
    description: "A web reader for LLM-compiled personal wikis. Turn raw notes into a browsable knowledge graph with source provenance, semantic trails, and agent APIs.",
    images: ["/docs/screenshots/wiki-article.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aperture — Browse your LLM-compiled wiki",
    description: "A web reader for LLM-compiled personal wikis. Turn raw notes into a browsable knowledge graph.",
    images: ["/docs/screenshots/wiki-article.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' ws: wss:; font-src 'self'; worker-src 'self' blob: 'unsafe-eval';"
        />
      </head>
      <body className="min-h-dvh flex flex-col bg-background text-foreground transition-colors duration-300">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Skip to content
        </a>
        <div id="main-content">{children}</div>
      </body>
    </html>
  );
}
