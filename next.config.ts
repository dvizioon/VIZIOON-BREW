import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["10.220.0.164"],
  async rewrites() {
    return {
      beforeFiles: [{ source: "/assets/fundo.png", destination: "/assets/fundo.jpg" }],
    };
  },
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 30,
    },
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
