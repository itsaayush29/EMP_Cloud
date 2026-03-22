import { test, expect } from '@playwright/test';

test('Application Health Check', async ({ page }) => {
  try {
    const response = await page.goto('/login', { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    expect(response?.ok()).toBeTruthy();
    await expect(page).toHaveURL(/login|dashboard/, { timeout: 30000 });
    console.log(`Health route is accessible: ${page.url()}`);
  } catch (error) {
    console.error('Application health check failed:', error.message);
    console.error('Verify BASE_URL in your .env file:', process.env.BASE_URL);
    throw new Error(`Application not accessible: ${error.message}`);
  }
});
