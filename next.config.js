/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // REMOVED: i18n config - App Router doesn't support Pages Router i18n pattern
  // Using custom client-side i18n with LanguageProvider instead

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com',
  },

  // Output configuration for production
  output: 'standalone',

  // Disable x-powered-by header
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(self), payment=(), usb=()',
          },
        ],
      },
    ];
  },

  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com';
    return {
      // No beforeFiles - let Next.js API routes handle requests first
      beforeFiles: [],
      // afterFiles runs after checking filesystem (including API routes)
      afterFiles: [],
      // Fallback rewrites to backend for routes not handled by local API routes
      // This ensures local /app/api/* routes take precedence
      fallback: [
        {
          source: '/api/:path*',
          destination: `${apiUrl}/api/:path*`,
        },
      ],
    };
  },

  async redirects() {
    return [
      {
        source: '/',
        destination: '/introduction',
        permanent: false,
      },
      // Redirect old tool routes to canonical /tools/* paths to eliminate duplicate content
      {
        source: '/ardha',
        destination: '/tools/ardha',
        permanent: true,
      },
      {
        source: '/karmic-tree',
        destination: '/tools/karmic-tree',
        permanent: true,
      },
      {
        source: '/emotional-reset',
        destination: '/tools/emotional-reset',
        permanent: true,
      },
      {
        source: '/karma-footprint',
        destination: '/tools/karma-footprint',
        permanent: true,
      },
      {
        source: '/relationship-compass',
        destination: '/tools/relationship-compass',
        permanent: true,
      },
      {
        source: '/viyog',
        destination: '/tools/viyog',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
