import { expect, test } from '@playwright/test';
import { testScenarios } from '../../data/invoice-scenarios.js';
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

test('Invoice Creation With Multiple Line Items', async ({ page }) => {
  test.setTimeout(120000);

  const data = testScenarios.multipleItems;

  try {
    console.log('Starting multiple-items invoice test...');
    console.log('Opening dashboard with shared authenticated session...');
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    console.log('Opening invoices module...');
    await safeClick(page.getByRole('link', { name: /invoices/i }), 'invoices link');
    await page.waitForLoadState('networkidle');
    await safeClick(page.getByRole('button', { name: /new invoice/i }), 'new invoice button');

    console.log('Filling invoice details...');
    await selectFirstAvailableClient(page);
    await safeFill(page.getByRole('textbox', { name: /issue date/i }), data.invoice.issueDate, 'issue date');
    await safeFill(page.getByRole('textbox', { name: /due date/i }), data.invoice.dueDate, 'due date');
    await page.getByLabel(/currency/i).selectOption(data.invoice.currency);
    await safeFill(page.getByRole('textbox', { name: /reference/i }), data.invoice.reference, 'reference');

    console.log('Filling invoice line items...');
    for (const [index, item] of data.lineItems.entries()) {
      if (index > 0) {
        await safeClick(page.getByRole('button', { name: /add line item/i }), `add line item ${index + 1}`);
      }

      await safeFill(page.locator(`input[name="items.${index}.name"]`), item.name, `item ${index + 1} name`);
      await safeFill(page.locator(`input[name="items.${index}.description"]`), item.description, `item ${index + 1} description`);
      await safeFill(page.locator(`input[name="items.${index}.quantity"]`), item.quantity, `item ${index + 1} quantity`);
      await safeFill(page.locator(`input[name="items.${index}.rate"]`), item.rate, `item ${index + 1} rate`);
    }

    await safeFill(page.getByRole('textbox', { name: /notes/i }), data.invoice.notes, 'notes');
    await safeFill(page.getByRole('textbox', { name: /terms/i }), data.invoice.terms, 'terms');
    await safeClick(page.getByRole('button', { name: /add field/i }), 'add field button');
    await safeFill(page.getByRole('textbox', { name: /field name/i }), data.invoice.customField.name, 'custom field name');
    await safeFill(page.getByRole('textbox', { name: /^value$/i }), data.invoice.customField.value, 'custom field value');

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
      await test.step('wait for invoice form to settle after successful creation', async () => {
        await page.waitForLoadState('networkidle').catch(() => {});
      });
    }
  } catch (error) {
    console.error('Multiple-items invoice flow failed:', error.message);
    await page.screenshot({ path: `test-results/invoice-multiple-error-${Date.now()}.png` });
    throw error;
  }
});
