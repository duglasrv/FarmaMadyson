import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'pnpm --filter @farma/api dev',
      url: 'http://localhost:4000/api/health',
      reuseExistingServer: !process.env.CI,
      cwd: '../../',
      timeout: 30_000,
    },
    {
      command: 'pnpm --filter @farma/web dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      cwd: '../../',
      timeout: 30_000,
    },
  ],
});
