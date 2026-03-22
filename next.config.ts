import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
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
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://connect.facebook.net https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://storage.googleapis.com https://*.firebasestorage.googleapis.com https://www.facebook.com",
              "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://www.facebook.com https://connect.facebook.net",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Canonical blog slug redirects — avoid duplicate indexing
      {
        source: '/articles/custom-vs-template-website',
        destination: '/articles/custom-website-vs-template-belfast',
        permanent: true,
      },
      {
        source: '/articles/how-long-to-build-a-website',
        destination: '/articles/how-long-to-build-website-belfast',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
