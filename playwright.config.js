// @ts-check
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const isCI = Boolean(process.env.CI);
const timeout = Number.parseInt(process.env.TIMEOUT ?? '60000', 10);

export default defineConfig({
  testDir: './tests/specs',
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 1,
  workers: isCI ? 1 : 2,
  reporter: isCI
    ? [['json'], ['./reporters/four-line-summary-reporter.js']]
    : [['html', { open: 'never' }], ['./reporters/four-line-summary-reporter.js']],
  timeout: Number.isFinite(timeout) ? timeout : 60000,
  expect: {
    timeout: 30000,
  },
  use: {
    baseURL: process.env.BASE_URL || 'https://test-billing.empcloud.com',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: isCI ? 'off' : 'retain-on-failure',
    headless: process.env.HEADLESS !== 'false',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
