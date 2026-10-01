import { defineConfig } from "eslint/config";
import nextPlugin from "@next/eslint-plugin-next";

export default defineConfig([
  ...nextPlugin.configs.recommended,
  ...nextPlugin.configs["core-web-vitals"],
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
]);
