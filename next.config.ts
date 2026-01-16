import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Mark pdf-parse and pdfjs-dist as external packages to avoid webpack bundling issues
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },
};


export default nextConfig;

