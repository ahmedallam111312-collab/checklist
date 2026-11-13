import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

// 1. Enforce NODE_ENV = "test" prior to loading environment configuration.
// Under NODE_ENV === "test", @next/env strictly excludes .env.local:
// (d !== "test" && ".env.local") evaluates to false.
(process.env as Record<string, string | undefined>).NODE_ENV = "test";

const { loadedEnvFiles } = loadEnvConfig(process.cwd());

// Runtime safety guard: Guarantee that .env.local is never loaded into process.env
if (loadedEnvFiles?.some((f) => f.path.endsWith(".env.local"))) {
  throw new Error("🛑 [CRITICAL SAFETY VIOLATION] .env.local was loaded under NODE_ENV=test!");
}

export default defineConfig({
  testDir: "./tests",
  testMatch: /.*\.spec\.ts/,
  testIgnore: ["**/unit/**", "**/support/**"],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  globalSetup: "./tests/support/global-setup.ts",
  globalTeardown: "./tests/support/global-teardown.ts",
  use: {
    baseURL: "http://localhost:3000",
    channel: "chrome",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 60000,
    env: {
      ...process.env,
      NODE_ENV: "test",
    },
  },
});
