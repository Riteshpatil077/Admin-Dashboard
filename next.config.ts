import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  // Needed for Prisma on Vercel
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
