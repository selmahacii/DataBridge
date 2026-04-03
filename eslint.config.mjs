import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/components/layout/**",
    "src/components/pages/**",
    "src/components/shared/**",
    "src/components/login/**",
    "src/hooks/**",
    "src/lib/seed.ts",
    "src/lib/mock-data.ts",
  ]),
]);

export default eslintConfig;
