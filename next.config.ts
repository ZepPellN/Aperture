import type { NextConfig } from "next";

const csp =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:; " +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: blob:; " +
  "connect-src 'self' ws: wss:; " +
  "font-src 'self'; " +
  "worker-src 'self' blob: 'unsafe-eval';";

const nextConfig: NextConfig = {
  // output: 'export' should only be used for production static builds.
  // Keeping it active during `next dev` causes chunk re-evaluation issues
  // and can trigger CSP errors on navigation.
  ...(process.env.NODE_ENV === 'production' ? { output: 'export', distDir: 'dist' } : {}),
  devIndicators: false,
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
