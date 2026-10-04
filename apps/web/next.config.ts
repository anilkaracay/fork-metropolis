import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@fork/shared", "@fork/db"],
  serverExternalPackages: [
    "@electric-sql/pglite",
    "@privy-io/node",
    "@neondatabase/serverless",
    "ws",
  ],
  distDir: process.env.FORK_TEST_MODE === "1" ? ".next-test" : ".next",
  poweredByHeader: false,
  devIndicators: false,
};
export default config;
