import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Block MIME sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Referrer policy
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Permissions policy — disable unnecessary browser APIs
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // XSS protection (legacy browsers)
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // HSTS — force HTTPS for 1 year
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  // Content Security Policy
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js inline scripts + framer-motion
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Tailwind inline styles + Radix UI
      "style-src 'self' 'unsafe-inline'",
      // Cloudinary images & videos
      "img-src 'self' data: blob: https://res.cloudinary.com",
      "media-src 'self' blob: https://res.cloudinary.com",
      // Cloudinary upload API + NextAuth callbacks
      "connect-src 'self' https://api.cloudinary.com https://res.cloudinary.com",
      // Fonts (self-hosted)
      "font-src 'self' data:",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // ── Images ────────────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
    formats: ["image/avif", "image/webp"],
    // Cache optimised images for 7 days
    minimumCacheTTL: 604800,
  },

  // ── Bundler ───────────────────────────────────────────────────────────────
  // Prisma + bcryptjs must stay on the server — prevent edge-runtime warnings
  serverExternalPackages: ["@prisma/client", "bcryptjs"],

  // ── Compression ──────────────────────────────────────────────────────────
  compress: true,

  // ── Power source maps in production for error tracking ───────────────────
  productionBrowserSourceMaps: false,

  // ── Security headers on every route ──────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // ── Redirects ─────────────────────────────────────────────────────────────
  async redirects() {
    return [
      // Bare domain → admin dashboard (admins) or client dashboard (clients)
      // Actual role-based redirect is handled by middleware; this catches /
      {
        source: "/",
        destination: "/login",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
