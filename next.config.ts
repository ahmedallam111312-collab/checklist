import type { NextConfig } from "next";

// Production validation: fail build if demo mode or invalid site URL
if (process.env.VERCEL && process.env.NEXT_PUBLIC_USE_DEMO_DATA === "true") {
  throw new Error(
    "BUILD REJECTED: NEXT_PUBLIC_USE_DEMO_DATA cannot be 'true' on a deployed Vercel build. Disable demo mode in environment variables."
  );
}

if (process.env.VERCEL || process.env.STRICT_PROD_SITE_URL === "true") {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    throw new Error(
      "BUILD REJECTED: NEXT_PUBLIC_SITE_URL is required in production builds. Set your production domain in Vercel."
    );
  }
  if (siteUrl.includes("localhost") || siteUrl.includes("127.0.0.1")) {
    throw new Error(
      `BUILD REJECTED: NEXT_PUBLIC_SITE_URL cannot be localhost in production builds (got: '${siteUrl}'). Set your production domain in Vercel.`
    );
  }
}

const isDev = process.env.NODE_ENV !== "production";

const cspDirectives = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://*.mux.com;
  style-src 'self' 'unsafe-inline';
  font-src 'self' data:;
  img-src 'self' data: blob: https://*.supabase.co https://*.mux.com https://image.mux.com;
  media-src 'self' blob: https://*.mux.com https://stream.mux.com;
  connect-src 'self' https://*.supabase.co https://*.mux.com https://stream.mux.com https://stats.mux.com;
  worker-src 'self' blob:;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    // Strictly fail production build if TypeScript errors exist
    ignoreBuildErrors: false,
  },
  eslint: {
    // Strictly fail production build if ESLint errors exist
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      // Global security headers on all routes
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspDirectives,
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
      // Admin UI routes: strictly noindex, no-cache
      {
        source: "/admin/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive",
          },
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
      // Admin & API routes: strictly noindex, no-cache
      {
        source: "/api/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive",
          },
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
