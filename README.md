# EMP Billing Selenium Suite

End-to-end Selenium WebDriver automation for the EMP Billing application. This suite covers authentication, shared session setup, public registration, and the onboarding flow that follows account creation.

## What This Project Covers

- Login validation and authentication scenarios
- Shared authenticated session setup for reuse across flows
- Public account registration
- Post-registration onboarding and initial setup

## Tech Stack

- Node.js 20+
- Selenium WebDriver
- Mocha
- Chrome

## Project Structure

```text
tests/
  data/
    auth-data.js
    onboarding-data.js
    registration-data.js
  framework/
    auth/
      login.js
    config/
      env.js
    core/
      browser.js
      navigation.js
      network.js
      storage.js
    support/
      artifacts.js
      interactions.js
      locators.js
      waits.js
  pages/
    auth/
      login.page.js
      registration.page.js
    onboarding/
      onboarding.page.js
  specs/
    auth/
      auth.setup.js
      login.spec.js
    registration/
      create-account.spec.js
```

## Getting Started

1. Install Node.js 20 or later.
2. Install Google Chrome on the machine where the tests will run.
3. Install dependencies:

```bash
npm install
```

4. Create a `.env` file in the project root:

```env
BASE_URL=https://test-billing.empcloud.com
ADMIN_EMAIL=admin@acme.com
ADMIN_PASSWORD=your-password
TIMEOUT=60000
HEADLESS=true
```

## Environment Notes

- `ADMIN_EMAIL` and `ADMIN_PASSWORD` are required for authentication-related flows.
- `HEADLESS=true` runs Chrome in headless mode by default.
- The shared auth setup stores reusable session data under `selenium/.auth/`.

## Available Scripts

```bash
npm test
npm run test:login
npm run test:auth-setup
npm run test:registration
npm run test:headed
npm run test:headless
```

## Script Details

- `npm test` runs login, shared authentication setup, and registration in sequence.
- `npm run test:login` runs the authentication/login scenarios.
- `npm run test:auth-setup` generates the shared authenticated session.
- `npm run test:registration` runs account creation and onboarding coverage.
- `npm run test:headed` runs the full suite with a visible browser.
- `npm run test:headless` runs the full suite in headless mode.

## Recommended Local Workflow

```bash
npm install
npm run test:login
npm run test:auth-setup
npm run test:registration
```

For a browserless run:

```bash
npm run test:headless
```

## Coverage Summary

- Authentication coverage includes valid login, invalid login, invalid email validation, password masking, and multi-click protection.
- Registration coverage includes public signup and the onboarding/setup flow after account creation.

## Implementation Notes

- Environment values are loaded from `.env`.
- Authentication credentials are kept in environment variables instead of hardcoded in specs.
- Registration and onboarding data generate unique values per run to reduce collisions.
- Shared browser, network, storage, and interaction helpers live under `tests/framework/`.
- Page objects are organized under `tests/pages/`.

## Troubleshooting

- If Chrome fails to launch from a restricted terminal on Windows, run the same command from a normal PowerShell or Command Prompt session.
- Sandbox or restricted environments may fail with errors such as `DevToolsActivePort file doesn't exist` or `Access is denied` even when the same command works outside the sandbox.

## Verification

- The commands in this README match the current scripts defined in `package.json`.
- The documented test structure matches the files currently present in `tests/`.
