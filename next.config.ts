import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep development and production artifacts separate so `next build` cannot
  // corrupt a running dev server's manifests.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'vfuedgrheyncotoxseos.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'sappffmylpsmbidysyqh.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'xavlyin.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Security headers to allow Ko-fi iframes, Tidio live chat, and prevent ad blocker issues
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [

          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://ko-fi.com" "https://*.ko-fi.com")',
          },
        ],
      },
      // Specific headers for checkout page to ensure Ko-fi iframe works
      {
        source: '/checkout',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },

        ],
      },
    ];
  },
  // Vercel optimizations
  compress: true,
  poweredByHeader: false,
  // Ensure proper serverless function timeouts
  experimental: {
    // Optimize serverless functions for Vercel
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
};

export default nextConfig;
