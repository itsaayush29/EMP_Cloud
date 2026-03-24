import { expect, test } from '@playwright/test';
import { invoiceData } from '../../data/invoice-data.js';
import { safeClick, safeFill } from '../../utils/ui-helpers.js';

async function selectFirstAvailableClient(page) {
  const clientSelect = page.getByLabel(/client/i);
  await expect(clientSelect).toBeVisible();

  const options = await clientSelect.locator('option').evaluateAll((elements) =>
    elements.map((option) => ({
      value: option.value,
      label: option.textContent?.trim() ?? '',
      disabled: option.disabled,
    }))
  );

  const selectedOption = options.find((option) => option.value && !option.disabled && !/select a client/i.test(option.label));
  if (!selectedOption) {
    throw new Error('No selectable client options were available in the invoice form.');
  }

  await clientSelect.selectOption(selectedOption.value);
  console.log(`Selected invoice client: ${selectedOption.label}`);
}

test('Invoice Flow', async ({ page }) => {
  test.setTimeout(120000);

  try {
    console.log('Starting invoice creation test...');
    console.log('Opening dashboard with shared authenticated session...');
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    console.log('Opening invoices module...');
    await safeClick(page.getByRole('link', { name: /invoices/i }), 'invoices link');
    await page.waitForLoadState('networkidle');
    await safeClick(page.getByRole('button', { name: /new invoice/i }), 'new invoice button');

    console.log('Filling invoice details...');
    await selectFirstAvailableClient(page);
    await safeFill(page.getByRole('textbox', { name: /issue date/i }), invoiceData.invoice.issueDate, 'issue date');
    await safeFill(page.getByRole('textbox', { name: /due date/i }), invoiceData.invoice.dueDate, 'due date');
    await page.getByLabel(/currency/i).selectOption(invoiceData.invoice.currency);
    await safeFill(page.getByRole('textbox', { name: /reference/i }), invoiceData.invoice.reference, 'reference');

    console.log('Filling invoice line items...');
    await safeFill(page.getByRole('textbox', { name: /item name/i }), invoiceData.lineItems[0].name, 'item name');
    await safeFill(page.getByRole('textbox', { name: /description/i }), invoiceData.lineItems[0].description, 'description');
    await safeFill(page.getByPlaceholder('1', { exact: true }), invoiceData.lineItems[0].quantity, 'quantity');
    await safeFill(page.getByPlaceholder('0.00'), invoiceData.lineItems[0].rate, 'rate');

    await safeClick(page.getByRole('button', { name: /add line item/i }), 'add line item button');
    await safeFill(page.locator('input[name="items.1.name"]'), invoiceData.lineItems[1].name, 'second item name');
    await safeFill(page.locator('input[name="items.1.description"]'), invoiceData.lineItems[1].description, 'second item description');
    await safeFill(page.locator('input[name="items.1.quantity"]'), invoiceData.lineItems[1].quantity, 'second item quantity');
    await safeFill(page.locator('input[name="items.1.rate"]'), invoiceData.lineItems[1].rate, 'second item rate');

    await safeFill(page.getByRole('textbox', { name: /notes/i }), invoiceData.invoice.notes, 'notes');
    await safeFill(page.getByRole('textbox', { name: /terms/i }), invoiceData.invoice.terms, 'terms');
    await safeClick(page.getByRole('button', { name: /add field/i }), 'add field button');
    await safeFill(page.getByRole('textbox', { name: /field name/i }), invoiceData.invoice.customField.name, 'custom field name');
    await safeFill(page.getByRole('textbox', { name: /^value$/i }), invoiceData.invoice.customField.value, 'custom field value');

    console.log('Submitting invoice...');
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/invoices') && response.request().method() === 'POST',
      { timeout: 30000 }
    ).catch(() => null);

    await safeClick(page.getByRole('button', { name: /create invoice/i }), 'create invoice button');
    const response = await responsePromise;
    expect(response, 'Invoice API response was not captured.').not.toBeNull();
    expect(response?.status()).toBe(201);

    const toast = page.locator('[role="status"]');
    const toastVisible = await toast.isVisible({ timeout: 15000 }).catch(() => false);

    if (toastVisible) {
      const text = (await toast.textContent()) || '';
      console.log('Toast message:', text);
    } else {
      console.log('Waiting for invoice page to settle...');
      await test.step('wait for invoice form to close after successful creation', async () => {
        await page.waitForLoadState('networkidle').catch(() => {});
      });
    }
  } catch (error) {
    console.error('Invoice flow failed:', error.message);
    await page.screenshot({ path: `test-results/invoice-error-${Date.now()}.png` });
    throw error;
  }
});
