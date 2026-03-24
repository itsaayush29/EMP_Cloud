import { test as setup } from '@playwright/test';
import { invoiceData } from '../../data/invoice-data.js';
import { login } from '../../utils/auth.js';

const authFile = 'playwright/.auth/user.json';

setup('authenticate once for protected modules', async ({ page }) => {
  console.log('Creating shared authenticated session...');
  await login(page, invoiceData.login);
  await page.context().storageState({ path: authFile });
  console.log(`Saved authenticated session to ${authFile}`);
});
