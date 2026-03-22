import { test } from '@playwright/test';
import { testScenarios } from '../../data/invoice-scenarios.js';
import { login } from '../../utils/auth.js';
import { expectApiSuccess, expectSuccessToast, safeClick, safeFill } from '../../utils/ui-helpers.js';

test('Invoice Creation With Multiple Line Items', async ({ page }) => {
  test.setTimeout(120000);

  const data = testScenarios.multipleItems;

  try {
    console.log('Starting multiple-items invoice test...');
    await login(page, data.login);

    await safeClick(page.getByRole('link', { name: /invoices/i }), 'invoices link');
    await page.waitForLoadState('networkidle');
    await safeClick(page.getByRole('button', { name: /new invoice/i }), 'new invoice button');

    await page.getByLabel(/client/i).selectOption({ index: data.invoice.clientIndex });
    await safeFill(page.getByRole('textbox', { name: /issue date/i }), data.invoice.issueDate, 'issue date');
    await safeFill(page.getByRole('textbox', { name: /due date/i }), data.invoice.dueDate, 'due date');
    await page.getByLabel(/currency/i).selectOption(data.invoice.currency);
    await safeFill(page.getByRole('textbox', { name: /reference/i }), data.invoice.reference, 'reference');

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

    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/invoices') && response.request().method() === 'POST',
      { timeout: 30000 }
    ).catch(() => null);

    await safeClick(page.getByRole('button', { name: /create invoice/i }), 'create invoice button');
    await expectApiSuccess(responsePromise, 'Invoice');
    await expectSuccessToast(page);
  } catch (error) {
    console.error('Multiple-items invoice flow failed:', error.message);
    await page.screenshot({ path: `test-results/invoice-multiple-error-${Date.now()}.png` });
    throw error;
  }
});
