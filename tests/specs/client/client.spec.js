import { expect, test } from '@playwright/test';
import { clientData } from '../../data/client-data.js';
import { safeClick, safeFill } from '../../utils/ui-helpers.js';

test('Client Module Flow', async ({ page }) => {
  test.setTimeout(120000);

  try {
    console.log('Opening dashboard with shared authenticated session...');
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();

    console.log('Opening clients module...');
    await safeClick(page.getByRole('link', { name: 'Clients' }), 'clients link');
    await expect(page.getByRole('button', { name: 'New Client' })).toBeVisible();

    console.log('Opening new client form...');
    await safeClick(page.getByRole('button', { name: 'New Client' }), 'new client button');
    await expect(page.getByRole('heading', { name: 'New Client' })).toBeVisible();

    console.log('Filling client form...');
    await safeFill(page.getByRole('textbox', { name: 'Client Name*' }), clientData.client.name, 'client name');
    await safeFill(page.getByRole('textbox', { name: 'Display Name' }), clientData.client.displayName, 'display name');
    await safeFill(page.getByRole('textbox', { name: 'Email*' }), clientData.client.email, 'client email');
    await safeFill(page.getByRole('textbox', { name: 'Phone' }), clientData.client.phone, 'phone');
    await page.getByLabel('Payment Terms').selectOption('0');
    await safeFill(page.getByRole('textbox', { name: 'GSTIN / Tax ID' }), clientData.client.gstin, 'gstin');
    await safeFill(page.getByRole('textbox', { name: 'Address Line' }), clientData.client.addressLine, 'address line');
    await safeFill(page.getByRole('textbox', { name: 'City' }), clientData.client.city, 'city');
    await safeFill(page.getByRole('textbox', { name: 'State' }), clientData.client.state, 'state');
    await safeFill(page.getByRole('textbox', { name: 'Postal Code' }), clientData.client.postalCode, 'postal code');
    await safeFill(page.getByRole('textbox', { name: 'Country' }), clientData.client.country, 'country');

    const tagInput = page.getByRole('textbox', { name: 'Type a tag and press Enter…' });
    await safeFill(tagInput, clientData.client.tag, 'tag');
    await page.keyboard.press('Enter');

    await safeFill(page.getByRole('textbox', { name: 'Notes' }), clientData.client.notes, 'notes');
    await safeClick(page.getByRole('button', { name: 'Add Field' }), 'add field button');

    const fieldNameInput = page.getByRole('textbox', { name: 'Field name' });
    if (await fieldNameInput.isVisible().catch(() => false)) {
      await fieldNameInput.click();
      await fieldNameInput.press('End').catch(() => {});
    }

    await safeFill(page.getByRole('textbox', { name: 'Value' }), clientData.client.customFieldValue, 'custom field value');

    console.log('Submitting client form...');
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/clients') && response.request().method() === 'POST',
      { timeout: 30000 }
    ).catch(() => null);

    await safeClick(page.getByRole('button', { name: 'Create Client' }), 'create client button');

    const response = await responsePromise;
    if (response) {
      console.log(`Client API status: ${response.status()}`);
      expect([200, 201]).toContain(response.status());
      expect(response.status()).toBe(201);
    } else {
      throw new Error('Client API response was not captured.');
    }
  } catch (error) {
    console.error('Client module flow failed:', error.message);
    await page.screenshot({ path: `test-results/client-error-${Date.now()}.png` }).catch(() => {});
    throw error;
  }
});
