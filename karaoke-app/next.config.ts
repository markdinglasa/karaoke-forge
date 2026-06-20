import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow larger file uploads for MP3 and images
  experimental: {
    serverActions: {
      bodySizeLimit: "60mb",
    },
  },
  // External packages that should not be bundled (native Node.js deps)
  serverExternalPackages: ["fluent-ffmpeg", "ffmpeg-static", "sharp", "formidable"],
};

export default nextConfig;
