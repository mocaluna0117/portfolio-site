import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/** Pages only the site's owner uses: never to be listed by a search engine. */
const PRIVATE_PATHS = ["/login0117", "/admin", "/admin/:path*"];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // Every image of a work is a file in Convex storage. A stored file never
    // changes (a new import stores new ones under new ids), so an optimised
    // copy may be kept for a long time.
    remotePatterns: [
      { protocol: "https", hostname: "*.convex.cloud", pathname: "/api/storage/**" },
      ...(isDev
        ? [
            {
              protocol: "http" as const,
              hostname: "127.0.0.1",
              port: "3210",
              pathname: "/api/storage/**",
            },
          ]
        : []),
    ],
    // The local Convex backend listens on 127.0.0.1, which the optimiser
    // refuses unless told otherwise. Only ever in development.
    dangerouslyAllowLocalIP: isDev,
    qualities: [75, 90],
    minimumCacheTTL: 60 * 60 * 24 * 31,
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return PRIVATE_PATHS.map((source) => ({
      source,
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
    }));
  },
};

export default nextConfig;
