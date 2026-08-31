import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@wego/domain": path.resolve(currentDir, "../../packages/domain/src"),
      "@wego/ui": path.resolve(currentDir, "../../packages/ui/src"),
    },
  },
  server: { port: 5173 },
});
