import { defineConfig } from "@playwright/test"

const PORT = 5174

export default defineConfig({
  testDir: "./e2e",
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

  projects: [
    // {
    //   name: 'Mobile Safari',
    //   use: {
    //     browserName: 'webkit',
    //     viewport: { width: 485, height: 932 },
    //     isMobile: true,
    //     hasTouch: true,
    //   },
    // },
    {
      name: "Chrome",
      use: { browserName: "chromium" },
    },
  ],

  webServer: {
    command: `pnpm dev --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
})
