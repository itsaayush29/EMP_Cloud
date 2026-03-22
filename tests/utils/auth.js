import { expect } from '@playwright/test';
import { safeClick, safeFill } from './ui-helpers.js';

export async function login(page, credentials) {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});

  const email = page.locator('input[type="email"], input[name="email"]').first();
  const password = page.locator('input[type="password"]').first();
  const signInButton = page.getByRole('button', { name: /sign in/i });
  const nav = page.getByRole('navigation').first();

  await expect
    .poll(
      async () => {
        const emailVisible = await email.isVisible().catch(() => false);
        const passwordVisible = await password.isVisible().catch(() => false);
        const navVisible = await nav.isVisible().catch(() => false);

        if (emailVisible && passwordVisible) return 'login';
        if (navVisible) return 'dashboard';
        return 'loading';
      },
      { timeout: 20000, intervals: [500, 1000, 2000] }
    )
    .not.toBe('loading');

  if ((await nav.isVisible().catch(() => false)) && /dashboard/.test(page.url())) {
    console.log('Already logged in');
    return;
  }

  if ((await email.isVisible().catch(() => false)) && (await password.isVisible().catch(() => false))) {
    await safeFill(email, credentials.email, 'email');
    await safeFill(password, credentials.password, 'password');
    await safeClick(signInButton, 'sign in button');
  } else {
    await expect(page).toHaveURL(/dashboard|login/, { timeout: 30000 });
  }

  await expect(page).toHaveURL(/dashboard/, { timeout: 60000 });
  console.log('Logged in successfully');
}
