import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Architecture 3 couches (voir INTENT.md) : présentation → service → données.
const forbid = (...layers) => ({
  "no-restricted-imports": [
    "error",
    {
      patterns: layers.map((layer) => ({
        group: [`@/${layer}`, `@/${layer}/*`],
        message: `Import interdit : cette couche ne doit pas dépendre de "${layer}" (architecture 3 couches).`,
      })),
    },
  ],
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  { files: ["src/app/**", "src/components/**"], rules: forbid("data") },
  { files: ["src/services/**"], rules: forbid("app", "components") },
  { files: ["src/data/**"], rules: forbid("services", "app", "components") },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
