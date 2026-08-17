import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

const nextConfig: NextConfig = {
  output: "standalone",
  assetPrefix: "/blog",
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  transpilePackages: [],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "commissionkit.co" }],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default withMDX(nextConfig);
