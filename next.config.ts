import type { NextConfig } from "next";

// Fail build immediately if deployed on Vercel with demo mode enabled
if (process.env.VERCEL && process.env.NEXT_PUBLIC_USE_DEMO_DATA === "true") {
  throw new Error(
    "BUILD REJECTED: NEXT_PUBLIC_USE_DEMO_DATA cannot be 'true' on a deployed Vercel build. Disable demo mode in environment variables."
  );
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
      {
        source: "/admin/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
