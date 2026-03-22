import { expect } from '@playwright/test';
import { safeClick, safeFill } from './ui-helpers.js';

export async function login(page, credentials) {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  const email = page.locator('input[type="email"], input[name="email"]').first();
  const password = page.locator('input[type="password"]').first();
  const signInButton = page.getByRole('button', { name: /sign in/i });

  const emailVisible = await email.isVisible({ timeout: 5000 }).catch(() => false);

  if (emailVisible) {
    await safeFill(email, credentials.email, 'email');
    await safeFill(password, credentials.password, 'password');
    await safeClick(signInButton, 'sign in button');
  } else {
    await expect(page).toHaveURL(/dashboard|login/, { timeout: 30000 });
  }

  await expect(page).toHaveURL(/dashboard/, { timeout: 60000 });
  console.log('Logged in successfully');
}
