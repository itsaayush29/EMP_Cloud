# EMP Billing Selenium Suite

Selenium WebDriver end-to-end tests for the EMP Billing application.

## Project Structure

```text
tests/
  data/
    client-data.js
    invoice-data.js
    payment-data.js
    quote-data.js
    registration-data.js
    registration-scenarios.js
    vendor-data.js
  specs/
    auth/
      auth.setup.js
    client/
      client.spec.js
    health/
      health-check.spec.js
    invoice/
      create-invoice.spec.js
    quotes/
      create-quote.spec.js
    payments/
      create-payment.spec.js
    registration/
      create-account.spec.js
    vendor/
      create-vendor.spec.js
  utils/
    auth.js
    ui-helpers.js
```

## Setup

1. Use Node.js `18+` or `20+`.

2. Install dependencies:

```bash
npm install
```

3. Configure `.env`:

```env
BASE_URL=https://test-billing.empcloud.com
ADMIN_EMAIL=admin@acme.com
ADMIN_PASSWORD=your-password
TIMEOUT=60000
HEADLESS=true
```

`ADMIN_EMAIL` and `ADMIN_PASSWORD` are required for the authenticated flows.
The shared auth setup saves a Selenium session snapshot under `playwright/.auth/` so protected flows can reuse the session data.

4. Make sure Google Chrome is installed on the machine.

Selenium uses the `selenium-webdriver` package. This repo currently launches Chrome for the shared auth flow.

## Running Tests

Current runnable Selenium commands:

```bash
npm test
npm run test:auth-setup
npm run test:registration
npm run test:headed
npm run test:headless
```

What each command does:

- `npm test`: runs the shared Selenium auth setup
- `npm run test:auth-setup`: runs the shared Selenium auth setup explicitly
- `npm run test:registration`: runs the Selenium registration flow
- `npm run test:headed`: runs the auth setup with the browser visible
- `npm run test:headless`: runs the auth setup in headless mode

Typical local workflow:

```bash
npm install
npm run test:headed
```

If you want to run without opening the browser:

```bash
npm run test:headless
```

If Chrome fails to launch from a restricted terminal on Windows, run the same command from a normal local PowerShell or Command Prompt window.

## Test Coverage

- `client`: authenticated client creation flow
- `health`: basic application availability check
- `invoice`: authenticated simple invoice creation flow
- `quotes`: authenticated simple quote creation flow
- `payments`: authenticated payment recording flow
- `registration`: public registration page coverage with positive and validation scenarios
- `vendor`: authenticated vendor creation flow

## Notes

- `.env` values are loaded quietly to keep test output readable.
- The Selenium auth setup is the currently wired execution path in this repo.
- Test data reads credentials from environment variables instead of hardcoding them in specs.
- Registration test data generates unique emails and organization names per run to reduce collisions.
- Specs are grouped by feature under `tests/specs/`.
- Shared login and UI interaction helpers live under `tests/utils/`.
- Generated references and vendor emails are unique per run to reduce data collisions.
- Authenticated modules run through `tests/specs/auth/auth.setup.js` first so a single saved session can be reused across protected flows.
- Several feature specs still need full Selenium conversion before they can be run as Selenium tests end-to-end.

## Verification

- The install and run steps above match the current package scripts.
- In this workspace, Chrome launch verification may still fail under terminal sandbox restrictions on Windows even when the same code works in a normal local shell.
