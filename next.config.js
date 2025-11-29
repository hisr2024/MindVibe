/** @type {import('next').NextConfig} */
const resolvedApiUrl = process.env.NEXT_PUBLIC_API_URL
  || (process.env.NODE_ENV !== 'production' ? 'http://localhost:8000' : null);

if (!resolvedApiUrl && process.env.NODE_ENV === 'production') {
  throw new Error('NEXT_PUBLIC_API_URL must be set in production to avoid leaking local defaults.');
}

const nextConfig = {
  reactStrictMode: true,

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
    NEXT_PUBLIC_API_URL: resolvedApiUrl || '',
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  async rewrites() {
    return {
      beforeFiles: resolvedApiUrl ? [
        {
          source: '/api/:path*',
          destination: `${resolvedApiUrl}/:path*`,
        },
      ] : [],
    };
  },
};

module.exports = nextConfig;
