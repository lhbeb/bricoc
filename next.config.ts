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
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://ko-fi.com https://*.ko-fi.com https://js.stripe.com https://chatapppay.vercel.app http://code.tidio.co https://code.tidio.co http://*.tidio.co https://*.tidio.co http://*.tidiochat.com https://*.tidiochat.com https://analyticsapp-five.vercel.app https://cokaro-mailproject.vercel.app https://pricemonitor-mocha.vercel.app https://www.paypal.com https://*.paypal.com https://www.17track.net https://connect.facebook.net",
              "style-src 'self' 'unsafe-inline' https://ko-fi.com https://*.ko-fi.com https://fonts.googleapis.com http://*.tidio.co https://*.tidio.co http://*.tidiochat.com https://*.tidiochat.com",
              "img-src 'self' data: blob: https: http:",
              "font-src 'self' data: https://fonts.gstatic.com https://ko-fi.com https://*.ko-fi.com http://code.tidio.co https://code.tidio.co http://*.tidio.co https://*.tidio.co http://*.tidiochat.com https://*.tidiochat.com",
              "frame-src 'self' https://ko-fi.com https://*.ko-fi.com https://www.youtube.com https://player.vimeo.com https://js.stripe.com https://*.stripe.com https://hooks.stripe.com https://chatapppay.vercel.app https://analyticsapp-five.vercel.app https://cokaro-mailproject.vercel.app https://pricemonitor-mocha.vercel.app https://www.paypal.com https://*.paypal.com https://extcall.17track.net http://*.tidio.co https://*.tidio.co http://*.tidiochat.com https://*.tidiochat.com http://*.tidio.com https://*.tidio.com",
              "connect-src 'self' https://ko-fi.com https://*.ko-fi.com https://vfuedgrheyncotoxseos.supabase.co https://sappffmylpsmbidysyqh.supabase.co https://*.supabase.co https://api.stripe.com https://*.stripe.com https://hooks.stripe.com https://*.stripe.network https://chatapppay.vercel.app http://*.tidio.co https://*.tidio.co http://*.tidio.com https://*.tidio.com http://*.tidiochat.com https://*.tidiochat.com wss://*.tidio.co wss://*.tidio.com wss://*.tidiochat.com https://analyticsapp-five.vercel.app https://analyticsapp.vercel.app https://cokaro-mailproject.vercel.app https://pricemonitor-mocha.vercel.app https://www.paypal.com https://*.paypal.com https://extcall.17track.net https://www.facebook.com",
              "media-src 'self' http://code.tidio.co https://code.tidio.co http://*.tidio.co https://*.tidio.co http://*.tidiochat.com https://*.tidiochat.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://ko-fi.com https://*.ko-fi.com https://www.paypal.com https://*.paypal.com",
            ].join('; '),
          },
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
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://ko-fi.com https://*.ko-fi.com https://js.stripe.com https://chatapppay.vercel.app http://code.tidio.co https://code.tidio.co http://*.tidio.co https://*.tidio.co http://*.tidiochat.com https://*.tidiochat.com https://analyticsapp-five.vercel.app https://cokaro-mailproject.vercel.app https://pricemonitor-mocha.vercel.app https://www.paypal.com https://*.paypal.com https://connect.facebook.net",
              "style-src 'self' 'unsafe-inline' https://ko-fi.com https://*.ko-fi.com https://fonts.googleapis.com http://*.tidio.co https://*.tidio.co http://*.tidiochat.com https://*.tidiochat.com",
              "img-src 'self' data: blob: https: http:",
              "font-src 'self' data: https://fonts.gstatic.com https://ko-fi.com https://*.ko-fi.com http://code.tidio.co https://code.tidio.co http://*.tidio.co https://*.tidio.co http://*.tidiochat.com https://*.tidiochat.com",
              "frame-src 'self' https://ko-fi.com https://*.ko-fi.com https://js.stripe.com https://*.stripe.com https://hooks.stripe.com https://chatapppay.vercel.app https://analyticsapp-five.vercel.app https://cokaro-mailproject.vercel.app https://pricemonitor-mocha.vercel.app https://www.paypal.com https://*.paypal.com http://*.tidio.co https://*.tidio.co http://*.tidiochat.com https://*.tidiochat.com http://*.tidio.com https://*.tidio.com",
              "connect-src 'self' https://ko-fi.com https://*.ko-fi.com https://vfuedgrheyncotoxseos.supabase.co https://sappffmylpsmbidysyqh.supabase.co https://*.supabase.co https://api.stripe.com https://*.stripe.com https://hooks.stripe.com https://*.stripe.network https://chatapppay.vercel.app http://*.tidio.co https://*.tidio.co http://*.tidio.com https://*.tidio.com http://*.tidiochat.com https://*.tidiochat.com wss://*.tidio.co wss://*.tidio.com wss://*.tidiochat.com https://analyticsapp-five.vercel.app https://analyticsapp.vercel.app https://cokaro-mailproject.vercel.app https://pricemonitor-mocha.vercel.app https://www.paypal.com https://*.paypal.com https://www.facebook.com",
              "media-src 'self' http://code.tidio.co https://code.tidio.co http://*.tidio.co https://*.tidio.co http://*.tidiochat.com https://*.tidiochat.com",
              "object-src 'none'",
              "form-action 'self' https://ko-fi.com https://*.ko-fi.com https://www.paypal.com https://*.paypal.com",
            ].join('; '),
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
