import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { credentials } from './tests/test-data/credentials.js';

dotenv.config({ quiet: true });

const authFile = path.resolve('playwright/.auth/user.json');

export default async function globalSetup(config) {
  await fs.mkdir(path.dirname(authFile), { recursive: true });

  const browser = await chromium.launch({
    headless: config.projects[0]?.use?.headless ?? true,
  });

  try {
    const page = await browser.newPage({
      baseURL: config.projects[0]?.use?.baseURL,
    });

    await page.goto('/login');
    await page.locator('input[type="email"], input[name="email"]').first().fill(credentials.email);
    await page.locator('input[type="password"]').first().fill(credentials.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/dashboard/, { timeout: 60000 });
    await page.context().storageState({ path: authFile });

    console.log('Auth session saved');
  } finally {
    await browser.close();
  }
}
