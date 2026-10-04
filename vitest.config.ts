import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    hookTimeout: 300000, // 5 mins for mongo download
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    alias: {
      "@/app": path.resolve(__dirname, "./app"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
