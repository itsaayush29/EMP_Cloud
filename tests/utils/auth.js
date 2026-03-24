import { expect } from '@playwright/test';
import { safeClick, safeFill } from './ui-helpers.js';

async function isAuthenticated(page) {
  const navigation = page.getByRole('navigation').first();
  return navigation.isVisible().catch(() => false);
}

async function captureFailure(page, prefix) {
  try {
    await page.screenshot({ path: `test-results/${prefix}-${Date.now()}.png` });
  } catch {
    // Ignore screenshot failures after teardown.
  }
}

export async function login(page, credentials) {
  console.log('Checking authenticated session...');
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

  if (await isAuthenticated(page)) {
    console.log('Using existing authenticated session');
    return;
  }

  console.log('Opening login page...');
  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  const email = page.locator('input[type="email"], input[name="email"]').first();
  const password = page.locator('input[type="password"]').first();
  const signInButton = page.getByRole('button', { name: /sign in/i });
  const statusToast = page.locator('[role="status"]').first();

  await expect(email).toBeVisible({ timeout: 30000 });
  await expect(password).toBeVisible({ timeout: 30000 });
  await expect(signInButton).toBeEnabled({ timeout: 30000 });

  console.log('Entering login credentials...');
  await safeFill(email, credentials.email, 'email');
  await safeFill(password, credentials.password, 'password');
  await safeClick(signInButton, 'sign in button');
  console.log('Waiting for dashboard after sign in...');

  try {
    await page.waitForURL(/\/dashboard\/?$/, { timeout: 60000 });
  } catch (error) {
    const toastVisible = await statusToast.isVisible({ timeout: 2000 }).catch(() => false);
    const toastText = toastVisible ? (await statusToast.textContent()) || 'Unknown login error' : 'No status message';
    await captureFailure(page, 'login-error');
    throw new Error(`Login did not reach the dashboard. ${toastText}. ${error.message}`);
  }

  console.log('Logged in successfully');
}
