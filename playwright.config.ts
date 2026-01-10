import { defineConfig } from "@playwright/test"

const PORT = 5174

export default defineConfig({
  testDir: "./e2e",
  timeout: 10000, // 10 seconds per test
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects:
    process.env.CI ?
      [
        {
          name: "Mobile Safari",
          use: {
            browserName: "webkit",
            viewport: { width: 485, height: 932 },
            isMobile: true,
            hasTouch: true,
          },
        },
        {
          name: "Chrome Desktop",
          use: {
            browserName: "chromium",
            viewport: { width: 1280, height: 1280 },
          },
        },
      ]
    : [
        {
          name: "Chrome Desktop",
          use: {
            browserName: "chromium",
            viewport: { width: 1280, height: 1280 },
          },
        },
      ],

  webServer: {
    command: `pnpm dev --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
})
