import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "../../tests/e2e",
  timeout: 60_000,
  use: { baseURL: "http://127.0.0.1:5173", trace: "retain-on-failure" },
  webServer: { command: "pnpm --filter @wego/web dev --host 127.0.0.1", url: "http://127.0.0.1:5173", reuseExistingServer: true },
  projects: [{ name: "mobile-chrome", use: { ...devices["Pixel 5"] } }, { name: "desktop-chrome", use: { ...devices["Desktop Chrome"] } }],
});
