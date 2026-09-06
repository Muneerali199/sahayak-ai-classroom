import type {NextConfig} from 'next';

const securityHeaders = [
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
    value: 'microphone=(self), camera=(), geolocation=(), payment=(), usb=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js hydration scripts + Firebase auth widget
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.firebaseio.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Napkin/visuals arrive as data URIs; unsplash for landing imagery
      "img-src 'self' data: blob: https://images.unsplash.com https://placehold.co https://*.googleusercontent.com",
      "media-src 'self' data: blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      // Firebase auth, Agora RTC (wss), and the optional local backend TTS
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://apis.google.com https://*.agora.io wss://*.agora.io wss: http://127.0.0.1:8001 http://localhost:8001",
      "frame-src https://*.firebaseapp.com https://apis.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  /* config options here */
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // The /demo page exists to be embedded (e.g. Commudle submission
        // iframe) — allow framing for it; every other route stays locked.
        // (Next applies all matching rules in order — later wins.)
        source: '/demo',
        headers: [
          // Unrecognized XFO value → browsers ignore the header entirely
          // (CSP frame-ancestors below is the real control and it takes
          // precedence anyway).
          {key: 'X-Frame-Options', value: 'ALLOW-FROM https://commudle.com'},
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob:",
              "media-src 'self' data: blob:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              // allow any host to embed the demo video page
              "frame-ancestors *",
            ].join('; '),
          },
        ],
      },
    ];
  },
  allowedDevOrigins: ['192.168.180.1'],
};

export default nextConfig;
