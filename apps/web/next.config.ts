import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const config: NextConfig = {
  transpilePackages: ["@fork/shared", "@fork/db"],
  serverExternalPackages: [
    "@electric-sql/pglite",
    "@privy-io/node",
    "pg",
    "ws",
  ],
  distDir: process.env.FORK_TEST_MODE === "1" ? ".next-test" : ".next",
  poweredByHeader: false,
  devIndicators: false,
  // Development uses Turbopack; the production-only alias below uses webpack.
  turbopack: {},
  webpack(config, { dev }) {
    if (!dev)
      config.resolve.alias = {
        ...config.resolve.alias,
        "../../test-support/runtime": fileURLToPath(
          new URL("./test-support/production.ts", import.meta.url),
        ),
      };
    return config;
  },
};
export default config;
