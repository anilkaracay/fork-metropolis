import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["packages/shared/test/**/*.test.ts", "packages/db/test/**/*.test.ts", "apps/web/tests/**/*.test.ts"],
    restoreMocks: true,
  },
});
