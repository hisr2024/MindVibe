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
    remotePatterns: [],
    formats: ['image/avif', 'image/webp'],
  },

  // NOTE: Do NOT inject NEXT_PUBLIC_API_URL into the client bundle.
  // The client must always use relative paths (e.g., /api/auth/login) so
  // requests go through the Next.js proxy layer which handles cookie
  // forwarding, retries, and backend cold-start resilience.
  // The server-side proxy (lib/proxy-utils.ts) reads NEXT_PUBLIC_API_URL
  // from process.env directly to know where the backend lives.

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
          {
            key: 'Content-Security-Policy',
            // Sanitize env var: strip semicolons/commas to prevent CSP directive injection
            value: (() => {
              const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://mindvibe-api.onrender.com')
                .replace(/[;,]/g, ' ')
                .trim();
              return [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com",
                "img-src 'self' data: https: https://kiaanverse.com https://*.kiaanverse.com",
                `connect-src 'self' ${apiUrl} https://kiaanverse.com https://www.kiaanverse.com https://mindvibe-api.onrender.com https://fonts.googleapis.com https://fonts.gstatic.com`,
                "media-src 'self' blob: data:",
                "worker-src 'self' blob:",
                "frame-ancestors 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "object-src 'none'",
                "report-uri /api/csp-report",
                "report-to csp-endpoint",
              ].join('; ') + ';';
            })(),
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

nextConfig.experimental = {
  optimizePackageImports: [
    'lucide-react',
    'date-fns',
    'recharts',
    'framer-motion',
    '@radix-ui/react-accordion',
    '@radix-ui/react-dialog',
    '@radix-ui/react-hover-card',
    '@radix-ui/react-switch',
    '@radix-ui/react-tooltip',
  ],
};

module.exports = nextConfig;
