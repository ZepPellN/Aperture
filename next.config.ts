import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export' should only be used for production static builds.
  // Keeping it active during `next dev` causes chunk re-evaluation issues
  // and can trigger CSP errors on navigation.
  ...(process.env.NODE_ENV === 'production' ? { output: 'export', distDir: 'dist' } : {}),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
