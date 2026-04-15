import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  devIndicators: false,
  transpilePackages: ["@howmanyat/ui"],
  basePath: process.env.BASE_PATH,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
