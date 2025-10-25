import { fileURLToPath } from "node:url";
import path from "node:path";

import { configDefaults, defineConfig } from "vitest/config";

const webRoot = fileURLToPath(new URL(".", import.meta.url));
const workspaceRoot = path.resolve(webRoot, "..", "..");
const sharedSrc = path.join(workspaceRoot, "packages", "shared", "src");

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    exclude: [...configDefaults.exclude, "tests/e2e/**"]
  },
  resolve: {
    alias: {
      "@": webRoot,
      "@blockbuilders/shared": path.join(sharedSrc, "index.ts"),
      "@blockbuilders/shared/": `${sharedSrc}/`
    }
  }
});
