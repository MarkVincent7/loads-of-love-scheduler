import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      wouter: path.resolve("./lib/wouter.tsx"),
    };

    return config;
  },
};

export default nextConfig;
