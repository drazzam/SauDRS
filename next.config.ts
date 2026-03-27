import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Vercel-native deployment — no static export needed
  // Vercel handles SSR/SSG automatically for Next.js
  images: { unoptimized: true },
};

export default nextConfig;
