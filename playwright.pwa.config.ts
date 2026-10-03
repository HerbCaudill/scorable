import { defineConfig, devices } from "@playwright/test"

/** Exercise real service-worker updates on an isolated production origin. */
export default defineConfig({
  testDir: "./e2e-pwa",
  timeout: 90_000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:7184",
    ...devices["Pixel 7"],
  },
  webServer: {
    command: "pnpm build && pnpm preview --host 127.0.0.1 --port 7184 --strictPort",
    url: "http://127.0.0.1:7184",
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
