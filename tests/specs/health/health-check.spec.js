import { test, expect } from '@playwright/test';

test('Application Health Check', async ({ page }) => {
  try {
    const response = await page.goto('/login', { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    expect(response?.ok()).toBeTruthy();
    console.log('Login route is accessible');

    const getAppState = async () => {
      const emailVisible = await page
        .locator('input[type="email"], input[name="email"]')
        .first()
        .isVisible()
        .catch(() => false);
      const passwordVisible = await page
        .locator('input[type="password"]')
        .first()
        .isVisible()
        .catch(() => false);
      const navVisible = await page.getByRole('navigation').first().isVisible().catch(() => false);

      if (emailVisible && passwordVisible) return 'login';
      if (navVisible) return 'app';
      return 'loading';
    };

    await expect.poll(getAppState, { timeout: 45000, intervals: [1000, 2000, 5000] }).not.toBe('loading');
    const state = await getAppState();

    console.log(state === 'login' ? 'Login inputs are visible' : 'Authenticated app shell is visible');
  } catch (error) {
    console.error('Application health check failed:', error.message);
    console.error('Verify BASE_URL in your .env file:', process.env.BASE_URL);
    throw new Error(`Application not accessible: ${error.message}`);
  }
});
