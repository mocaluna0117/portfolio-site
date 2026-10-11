import { defineConfig, devices } from "@playwright/test";

/**
 * Runs against `pnpm dev` with a local Convex deployment that has
 * ALLOW_PASSWORD_AUTH=true, ADMIN_EMAILS=admin@example.test and Turnstile's
 * test keys (docs/DEPLOY.md, "ローカルで動かす"). Uses the installed Chrome.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    channel: "chrome",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], channel: "chrome" },
      testMatch: /public\.spec/,
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
