import { test, expect } from '@playwright/test';
import { vendorData } from '../../data/vendor-data.js';
import { expectSuccessToast, safeClick, safeFill } from '../../utils/ui-helpers.js';

test('Vendor Creation Flow', async ({ page }) => {
  test.setTimeout(120000);

  try {
    console.log('Starting vendor creation test...');
    console.log('Opening dashboard with shared authenticated session...');
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    await safeClick(page.getByRole('link', { name: /vendors/i }), 'vendors link');
    await page.waitForLoadState('networkidle');
    await safeClick(page.getByRole('button', { name: /new vendor/i }).first(), 'new vendor button');
    await expect(page.getByRole('heading', { name: /new vendor/i })).toBeVisible();

    await safeFill(page.getByRole('textbox', { name: /vendor name\*/i }), vendorData.vendor.name, 'vendor name');
    await safeFill(page.getByRole('textbox', { name: /^company$/i }), vendorData.vendor.company, 'company');
    await safeFill(page.getByRole('textbox', { name: /^email$/i }), vendorData.vendor.email, 'vendor email');
    await safeFill(page.getByRole('textbox', { name: /^phone$/i }), vendorData.vendor.phone, 'phone');
    await safeFill(page.getByRole('textbox', { name: /gstin \/ tax id/i }), vendorData.vendor.taxId, 'tax id');
    await safeFill(page.getByRole('textbox', { name: /address line 1/i }), vendorData.vendor.addressLine1, 'address line 1');
    await safeFill(page.getByRole('textbox', { name: /address line 2/i }), vendorData.vendor.addressLine2, 'address line 2');
    await safeFill(page.getByRole('textbox', { name: /^city$/i }), vendorData.vendor.city, 'city');
    await safeFill(page.getByRole('textbox', { name: /^state$/i }), vendorData.vendor.state, 'state');
    await safeFill(page.getByRole('textbox', { name: /postal code/i }), vendorData.vendor.postalCode, 'postal code');
    await safeFill(page.getByRole('textbox', { name: /^country$/i }), vendorData.vendor.country, 'country');
    await safeFill(page.getByRole('textbox', { name: /^notes$/i }), vendorData.vendor.notes, 'notes');

    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/vendors') && response.request().method() === 'POST',
      { timeout: 30000 }
    ).catch(() => null);

    await safeClick(page.getByRole('button', { name: /create vendor/i }), 'create vendor button');
    const response = await responsePromise;
    expect(response, 'Vendor API response was not captured.').not.toBeNull();
    expect(response?.status()).toBe(201);

    const toastVisible = await page.locator('[role="status"]').isVisible({ timeout: 15000 }).catch(() => false);
    if (toastVisible) {
      await expectSuccessToast(page);
    } else {
      await expect(page.getByRole('heading', { name: /new vendor/i })).not.toBeVisible({ timeout: 15000 });
    }
  } catch (error) {
    console.error('Vendor creation flow failed:', error.message);
    await page.screenshot({ path: `test-results/vendor-error-${Date.now()}.png` });
    throw error;
  }
});
