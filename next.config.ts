import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  // Silence Prisma edge-runtime warnings in Next.js build output
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
};

export default nextConfig;
