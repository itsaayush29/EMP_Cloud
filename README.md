# EMP Billing Playwright Suite

Playwright end-to-end tests for the EMP Billing application.

## Project Structure

```text
tests/
  data/
    invoice-data.js
    invoice-scenarios.js
    vendor-data.js
  specs/
    health/
      health-check.spec.js
    invoice/
      create-invoice.spec.js
      create-invoice-multiple-items.spec.js
    vendor/
      create-vendor.spec.js
  utils/
    auth.js
    ui-helpers.js
reporters/
playwright.config.js
```

## Setup

1. Install dependencies:

```bash
npm install
npm run install:browsers
```

2. Configure `.env`:

```env
BASE_URL=https://test-billing.empcloud.com
ADMIN_EMAIL=admin@acme.com
ADMIN_PASSWORD=your-password
TIMEOUT=60000
HEADLESS=true
```

## Running Tests

```bash
npm test
npm run test:health
npm run test:invoice
npm run test:vendor
npm run test:headed
npm run report
```

## Notes

- `.env` values are loaded quietly to keep Playwright output readable.
- Test data reads credentials from environment variables instead of hardcoding them in specs.
- Specs are grouped by feature under `tests/specs/`.
- Shared login and UI interaction helpers live under `tests/utils/`.
- Generated references and vendor emails are unique per run to reduce data collisions.

## Verification

- `npx playwright test --list` succeeds against the new layout.
- Invoice and vendor specs pass on Chromium.
- The health check is intentionally tolerant of login-page vs app-shell startup timing.
