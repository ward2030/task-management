import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ['preview-chat-21af6474-8acb-4390-b0df-1c0617fd83a7.space.z.ai'],
};

export default nextConfig;
