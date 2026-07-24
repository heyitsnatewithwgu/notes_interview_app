import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright runs against the FULL running stack (frontend + backend + Postgres).
 * The stack is started outside Playwright — locally via
 *   docker compose -f docker-compose.dev.yml up
 * and in CI by the e2e workflow (see .github/workflows/e2e.yml). Point Playwright
 * at it with E2E_BASE_URL (defaults to the Vite dev server).
 */
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:5173';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
