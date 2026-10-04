import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  { settings: { next: { rootDir: "apps/web/" } } },
  globalIgnores([
    "**/.next/**",
    "**/.next-test/**",
    "indexer/.envio/**",
    "indexer/envio-env.d.ts",
    "**/test-results/**",
    "**/playwright-report/**",
    "**/node_modules/**",
    "**/next-env.d.ts",
    ".tools/**",
    "contracts/out/**",
    "contracts/cache/**",
    "artifacts/**",
  ]),
]);
