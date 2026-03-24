import { test, expect } from '@playwright/test';
import { registrationScenarios } from '../../data/registration-scenarios.js';
import { safeClick, safeFill } from '../../utils/ui-helpers.js';

async function openRegistrationPage(page) {
  console.log('Opening login page...');
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  console.log('Opening registration form...');
  await safeClick(page.getByRole('link', { name: /create one free/i }), 'create one free link');
  await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
}

async function fillRegistrationForm(page, user) {
  const firstName = page.getByRole('textbox', { name: /first name\*/i });
  const lastName = page.getByRole('textbox', { name: /last name\*/i });
  const workEmail = page.getByRole('textbox', { name: /work email\*/i });
  const organizationName = page.getByRole('textbox', { name: /organization name\*/i });
  const password = page.getByRole('textbox', { name: /password\*/i });

  if (user.firstName) {
    await safeFill(firstName, user.firstName, 'first name');
  }

  if (user.lastName) {
    await safeFill(lastName, user.lastName, 'last name');
  }

  if (user.workEmail) {
    await safeFill(workEmail, user.workEmail, 'work email');
  }

  if (user.organizationName) {
    await safeFill(organizationName, user.organizationName, 'organization name');
  }

  if (user.password) {
    await safeFill(password, user.password, 'password');
  }

  return {
    firstName,
    lastName,
    workEmail,
    organizationName,
    password,
  };
}

async function expectFieldToBeInvalid(locator) {
  await expect.poll(async () => locator.evaluate((element) => !element.checkValidity())).toBe(true);
}

test.describe('Registration Page Flow', () => {
  test(registrationScenarios.validRegistration.name, async ({ page }) => {
    test.setTimeout(120000);

    try {
      await openRegistrationPage(page);
      await fillRegistrationForm(page, registrationScenarios.validRegistration.user);

      await safeClick(page.getByRole('button', { name: /create free account/i }), 'create free account button');
      console.log('Waiting for registration result...');

      const dashboardLink = page.getByRole('link', { name: /dashboard/i });
      const welcomeMessage = page.getByText(/welcome! your account is/i);
      await expect(dashboardLink.or(welcomeMessage).first()).toBeVisible({ timeout: 30000 });
    } catch (error) {
      console.error('Registration flow failed:', error.message);
      await page.screenshot({ path: `test-results/registration-error-${Date.now()}.png` });
      throw error;
    }
  });

  test(registrationScenarios.missingFirstName.name, async ({ page }) => {
    await openRegistrationPage(page);
    const fields = await fillRegistrationForm(page, registrationScenarios.missingFirstName.user);

    await safeClick(page.getByRole('button', { name: /create free account/i }), 'create free account button');

    await expectFieldToBeInvalid(fields.firstName);
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
  });

  test(registrationScenarios.invalidEmail.name, async ({ page }) => {
    await openRegistrationPage(page);
    const fields = await fillRegistrationForm(page, registrationScenarios.invalidEmail.user);

    await safeClick(page.getByRole('button', { name: /create free account/i }), 'create free account button');

    await expectFieldToBeInvalid(fields.workEmail);
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
  });
});
