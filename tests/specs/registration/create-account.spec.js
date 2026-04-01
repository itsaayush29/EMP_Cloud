import assert from 'node:assert/strict';
import { until } from 'selenium-webdriver';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { registrationScenarios } from '../../data/registration-scenarios.js';
import { safeClick, safeFill } from '../../framework/support/interactions.js';
import { captureFailure } from '../../framework/support/artifacts.js';
import { createDriver, destroyDriver } from '../../framework/core/browser.js';
import { getTrackedResponseCount, trackNetworkResponse, waitForTrackedResponse } from '../../framework/core/network.js';
import { waitForVisible, isVisible } from '../../framework/support/waits.js';
import { waitForUrl } from '../../framework/core/navigation.js';
import { LoginPage } from '../../pages/auth/login.page.js';
import { RegistrationPage } from '../../pages/auth/registration.page.js';
import { OnboardingPage } from '../../pages/onboarding/onboarding.page.js';

function isTransientNavigationError(error) {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('target frame detached') ||
    message.includes('received inspector.detached event') ||
    message.includes('inspector.detached') ||
    message.includes('stale element reference') ||
    message.includes('no such window') ||
    message.includes('browsing context has been discarded')
  );
}

async function getCurrentUrlSafe(driver) {
  try {
    return await driver.getCurrentUrl();
  } catch (error) {
    if (isTransientNavigationError(error)) {
      return null;
    }

    throw error;
  }
}

async function waitForFreshVisible(driver, locator, timeout = 30000) {
  return driver.wait(async () => {
    try {
      const element = await waitForVisible(driver, locator, 2000);
      return element;
    } catch (error) {
      if (isTransientNavigationError(error)) {
        return false;
      }

      return false;
    }
  }, timeout);
}

async function dismissRegistrationPopup(driver) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const popupVisible = await isVisible(driver, RegistrationPage.popupCloseButton, 2000).catch(() => false);
    if (!popupVisible) {
      return;
    }

    try {
      await safeClick(driver, RegistrationPage.popupCloseButton, 'registration popup dismiss button');
    } catch (error) {
      if (!isTransientNavigationError(error)) {
        throw error;
      }
    }
    await driver.sleep(1000);
  }
}

async function waitForRegistrationForm(driver, timeout = 30000) {
  return driver.wait(async () => {
    try {
      const url = await getCurrentUrlSafe(driver);
      // Leave this wait if the app has already moved us to the onboarding flow.
      if (url && /\/onboarding/.test(new URL(url).pathname)) {
        return false;
      }

      const organizationNameField = await waitForVisible(driver, RegistrationPage.organizationNameField, 2000);
      await dismissRegistrationPopup(driver);
      return organizationNameField;
    } catch (error) {
      if (isTransientNavigationError(error)) {
        return false;
      }

      return false;
    }
  }, timeout);
}

async function openRegistrationPage(driver) {
  console.log('Opening login page...');
  await driver.get('https://test-empcloud.empcloud.com/login');
  await waitForFreshVisible(driver, LoginPage.signInHeading, 30000);
  await dismissRegistrationPopup(driver);

  console.log('Opening registration form...');
  await driver.wait(async () => {
    try {
      await safeClick(driver, RegistrationPage.registerOrganizationLink, 'register your organization link');
      return true;
    } catch (error) {
      if (isTransientNavigationError(error)) {
        return false;
      }

      return false;
    }
  }, 30000);

  await waitForRegistrationForm(driver, 30000);
  await dismissRegistrationPopup(driver);
}

async function fillRegistrationForm(driver, user) {
  if (user.organizationName) {
    await safeFill(driver, RegistrationPage.organizationNameField, user.organizationName, 'organization name');
  }

  if (user.organizationCountry) {
    await safeFill(driver, RegistrationPage.organizationCountryField, user.organizationCountry, 'organization country');
  }

  if (user.organizationState) {
    await safeFill(driver, RegistrationPage.organizationStateField, user.organizationState, 'organization state');
  }

  if (user.firstName) {
    await safeFill(driver, RegistrationPage.firstNameField, user.firstName, 'first name');
  }

  if (user.lastName) {
    await safeFill(driver, RegistrationPage.lastNameField, user.lastName, 'last name');
  }

  if (user.workEmail) {
    await safeFill(driver, RegistrationPage.workEmailField, user.workEmail, 'work email');
  }

  if (user.password) {
    await safeFill(driver, RegistrationPage.passwordField, user.password, 'password');
  }

  return {
    organizationName: RegistrationPage.organizationNameField,
    organizationCountry: RegistrationPage.organizationCountryField,
    organizationState: RegistrationPage.organizationStateField,
    firstName: RegistrationPage.firstNameField,
    lastName: RegistrationPage.lastNameField,
    workEmail: RegistrationPage.workEmailField,
    password: RegistrationPage.passwordField,
  };
}

async function expectFieldToBeInvalid(driver, locator) {
  await driver.wait(async () => {
    try {
      const element = await driver.wait(until.elementLocated(locator), 2000);
      const state = await driver.executeScript(
        `
          return {
            checkValidity: typeof arguments[0].checkValidity === 'function' ? arguments[0].checkValidity() : true,
            validationMessage: arguments[0].validationMessage || '',
            ariaInvalid: arguments[0].getAttribute('aria-invalid') || '',
            required: arguments[0].required === true,
            value: arguments[0].value || ''
          };
        `,
        element
      );

      return (
        state.checkValidity === false ||
        state.validationMessage.length > 0 ||
        state.ariaInvalid === 'true' ||
        (state.required && state.value === '')
      );
    } catch (error) {
      if (isTransientNavigationError(error)) {
        return false;
      }

      return false;
    }
  }, 10000);
}

async function expectRegistrationToStayOnForm(driver) {
  const organizationNameField = await waitForRegistrationForm(driver, 10000);
  assert.equal(await organizationNameField.isDisplayed(), true);
}

async function readTrackedResponseState(driver, key) {
  return driver
    .executeScript(
      `
        const memoryValue = window.__empNetwork?.[arguments[0]];
        if (memoryValue) {
          return memoryValue;
        }

        try {
          const stored = JSON.parse(window.sessionStorage.getItem('__empNetworkState') || '{}');
          return stored?.[arguments[0]] ?? null;
        } catch {
          return null;
        }
      `,
      key
    )
    .catch((error) => {
      if (isTransientNavigationError(error)) {
        return null;
      }

      throw error;
    });
}

// ---------------------------------------------------------------------------
// suppressWindowClose
// Used ONLY for validation-error tests (missingFirstName, invalidEmail) where
// we deliberately want the page to stay put after clicking submit.
// ---------------------------------------------------------------------------
async function suppressWindowClose(driver) {
  try {
    await driver.executeScript(
      `
        (function(){
          if (!window.__empTestHelpers) {
            window.__empTestHelpers = {};
          }

          if (!window.__empTestHelpers._closePatched) {
            window.__empTestHelpers._origClose = window.close;
            window.close = function() { console.warn('window.close suppressed by test harness'); };
            try { window.self.close = window.close; } catch(e) {}
            window.__empTestHelpers._closePatched = true;
          }

          if (!window.__empTestHelpers._openPatched) {
            window.__empTestHelpers._origOpen = window.open;
            window.open = function(){ console.warn('window.open suppressed by test harness'); return null; };
            window.__empTestHelpers._openPatched = true;
          }
        })();
      `
    );
  } catch (error) {
    if (isTransientNavigationError(error)) {
      return;
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// submitAndAwaitRedirectChain
//
// Clicks the Create Account button and then follows the redirect chain using
// Selenium's native window-handle management — no JS window.close patching.
//
// The app may react to the registration submit in one of several ways:
//   1. SPA route change   → same window, URL updates to /onboarding (or a sub-route).
//   2. window.open()      → a new browser window/tab opens containing /onboarding.
//   3. window.open()      → new window opens, then app calls window.close() on the
//                           original; Selenium loses the old handle automatically.
//
// All three cases are handled by monitoring getAllWindowHandles() and the
// current URL on every polling tick.
// ---------------------------------------------------------------------------
async function submitAndAwaitRedirectChain(driver, {
  networkKey = null,
  // Match any URL whose *pathname* begins with /onboarding so that sub-routes
  // like /onboarding/step/1 or /onboarding?locale=en are also accepted.
  finalPattern = /^\/onboarding/,
  timeout = 60000,
} = {}) {
  // Snapshot the currently open windows before clicking.
  const knownHandles = new Set(await driver.getAllWindowHandles());

  // Click submit — tolerate transient detach errors caused by fast navigation.
  try {
    await safeClick(driver, RegistrationPage.createFreeAccountButton, 'create free account button');
  } catch (error) {
    if (!isTransientNavigationError(error)) {
      throw error;
    }
    console.warn('Transient error during submit click — navigation likely started, continuing poll...');
  }

  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    try {
      // ── 1. Discover any new windows the app opened ──────────────────────
      const allHandles = await driver.getAllWindowHandles();
      for (const handle of allHandles) {
        if (!knownHandles.has(handle)) {
          console.log(`New window detected (handle: ${handle}), switching to it...`);
          await driver.switchTo().window(handle);
          knownHandles.add(handle);
        }
      }

      // ── 2. Check whether we have reached the target URL ────────────────
      const currentUrl = await getCurrentUrlSafe(driver);
      if (currentUrl) {
        const pathname = new URL(currentUrl).pathname;

        if (finalPattern.test(pathname)) {
          console.log(`Reached target URL: ${currentUrl}`);
          return currentUrl;
        }

        // The app may briefly route through '/' or '/dashboard' — keep waiting.
      }
    } catch (error) {
      // The original window may have been closed by the app.  Try to recover by
      // switching to any remaining window and continuing the poll.
      if (isTransientNavigationError(error)) {
        try {
          const remaining = await driver.getAllWindowHandles();
          if (remaining.length > 0) {
            const target = remaining.find((h) => !knownHandles.has(h)) ?? remaining.at(-1);
            await driver.switchTo().window(target);
            knownHandles.add(target);
          }
        } catch {
          // ignore secondary switch errors
        }
      } else {
        throw error;
      }
    }

    // Check network tracker (informational — does not gate the URL wait).
    if (networkKey) {
      await readTrackedResponseState(driver, networkKey).catch(() => null);
    }

    await driver.sleep(250);
  }

  const finalUrl = await getCurrentUrlSafe(driver);
  throw new Error(
    `Timeout (${timeout}ms) waiting for redirect to pattern ${finalPattern}. ` +
    `Last URL: ${finalUrl ?? 'unknown'}`
  );
}

// ---------------------------------------------------------------------------
// completeOnboardingStep
//
// Handles a single onboarding wizard step:
//   1. Waits for the step content to stabilise.
//   2. Fills any required fields for that step (add locators to
//      OnboardingPage and call safeFill / safeClick here as needed).
//   3. Clicks the primary Continue / Next / Finish button.
// ---------------------------------------------------------------------------
async function completeOnboardingStep(driver, stepNumber) {
  console.log(`Completing onboarding step ${stepNumber}/5...`);

  // Give the SPA time to render the new step before interacting.
  await driver.sleep(1500);

  // ── Step-specific field filling ─────────────────────────────────────────
  // Uncomment and extend the blocks below once you know the exact field names
  // that appear on each onboarding step.
  //
  // if (stepNumber === 1) {
  //   await safeFill(driver, OnboardingPage.step1ExampleField, 'value', 'field label');
  // }
  // if (stepNumber === 2) {
  //   await safeFill(driver, OnboardingPage.step2ExampleField, 'value', 'field label');
  // }
  // … and so on for steps 3-5.
  // ────────────────────────────────────────────────────────────────────────

  // Click the primary CTA (Continue / Next / Finish).
  // First try the text-based XPath; fall back to the CSS brand-button selector.
  let clicked = false;
  for (const locator of [OnboardingPage.continueButton, OnboardingPage.primaryButton]) {
    try {
      await safeClick(driver, locator, `onboarding step ${stepNumber} continue button`);
      clicked = true;
      break;
    } catch {
      // Try the next locator.
    }
  }

  if (!clicked) {
    throw new Error(
      `Could not locate a Continue/Next/Finish button on onboarding step ${stepNumber}. ` +
      'Add the correct locator to OnboardingPage.continueButton or OnboardingPage.primaryButton.'
    );
  }

  console.log(`Onboarding step ${stepNumber} submitted.`);
}

// ---------------------------------------------------------------------------
// completeOnboarding
//
// Drives the full 5-step onboarding wizard that appears after registration.
// After the final step the app redirects away from /onboarding (typically to
// the dashboard).  The function returns the URL the driver ends up at.
// ---------------------------------------------------------------------------
async function completeOnboarding(driver) {
  console.log('Beginning onboarding wizard...');

  // Safety check — ensure the driver is on an onboarding URL before starting.
  await waitForUrl(driver, /\/onboarding/, 15000);

  for (let step = 1; step <= 5; step++) {
    await completeOnboardingStep(driver, step);

    // After each step check if the app has already moved us off /onboarding
    // (the redirect can happen earlier than step 5 if the wizard is shorter).
    const url = await getCurrentUrlSafe(driver);
    if (url) {
      const pathname = new URL(url).pathname;
      if (!/\/onboarding/.test(pathname)) {
        console.log(`Onboarding finished after step ${step}. Redirected to: ${url}`);
        return url;
      }
    }
  }

  // If we are still on /onboarding after all steps, wait for the redirect.
  await driver.wait(async () => {
    const url = await getCurrentUrlSafe(driver);
    return Boolean(url && !/\/onboarding/.test(new URL(url).pathname));
  }, 15000, 'Expected to leave /onboarding after completing all onboarding steps');

  const finalUrl = await getCurrentUrlSafe(driver);
  console.log(`Onboarding completed. Final URL: ${finalUrl}`);
  return finalUrl;
}

describe('Registration Page Flow', function () {
  this.timeout(120000);

  let driver;
  let profileDir;

  beforeEach(async () => {
    const created = await createDriver();
    driver = created.driver;
    profileDir = created.profileDir;
  });

  afterEach(async () => {
    await destroyDriver(driver, profileDir);
    driver = undefined;
    profileDir = undefined;
  });

  it(registrationScenarios.validRegistration.name, async function () {
    try {
      await openRegistrationPage(driver);
      await fillRegistrationForm(driver, registrationScenarios.validRegistration.user);
      await trackNetworkResponse(driver, 'registerAccount', '/auth/register');

      // Submit and follow the full redirect chain (registration → dashboard → onboarding).
      // submitAndAwaitRedirectChain uses Selenium window-handle polling — no JS patching.
      await submitAndAwaitRedirectChain(driver, {
        networkKey: 'registerAccount',
        finalPattern: /^\/onboarding/,
        timeout: 60000,
      });

      console.log('Waiting for registration network response...');
      const responseStatus = await waitForTrackedResponse(driver, 'registerAccount', 30000);
      assert.equal(responseStatus, 201, `Expected registration API status to be 201, received ${responseStatus}.`);

      // Complete all 5 onboarding steps in the same browser session.
      await completeOnboarding(driver);

      console.log('Registration and onboarding completed successfully.');
    } catch (error) {
      console.error('Registration flow failed:', error.message);
      await captureFailure(driver, 'registration-error');
      throw error;
    }
  });

  it(registrationScenarios.missingFirstName.name, async function () {
    await openRegistrationPage(driver);
    const fields = await fillRegistrationForm(driver, registrationScenarios.missingFirstName.user);
    await trackNetworkResponse(driver, 'registerBlockedMissingFirstName', '/auth/register');

    // Submit but do not treat transient navigation as success for validation tests.
    try {
      // Ensure suppression is in place before clicking so the app cannot close the tab
      await suppressWindowClose(driver);
      await safeClick(driver, RegistrationPage.createFreeAccountButton, 'create free account button');
    } catch (error) {
      if (!isTransientNavigationError(error)) {
        throw error;
      }
    }

    // Re-check the field using a fresh locator to avoid stale references
    await expectFieldToBeInvalid(driver, RegistrationPage.firstNameField);
    const blockedStatus = await readTrackedResponseState(driver, 'registerBlockedMissingFirstName');
    assert.equal(blockedStatus, null);
    assert.equal(await getTrackedResponseCount(driver, 'registerBlockedMissingFirstName'), 0);
    await expectRegistrationToStayOnForm(driver);
  });

  it(registrationScenarios.invalidEmail.name, async function () {
    await openRegistrationPage(driver);
    const fields = await fillRegistrationForm(driver, registrationScenarios.invalidEmail.user);
    await trackNetworkResponse(driver, 'registerBlockedInvalidEmail', '/auth/register');

    try {
      await suppressWindowClose(driver);
      await safeClick(driver, RegistrationPage.createFreeAccountButton, 'create free account button');
    } catch (error) {
      if (!isTransientNavigationError(error)) {
        throw error;
      }
    }

    await expectFieldToBeInvalid(driver, RegistrationPage.workEmailField);
    const blockedStatus = await readTrackedResponseState(driver, 'registerBlockedInvalidEmail');
    assert.equal(blockedStatus, null);
    assert.equal(await getTrackedResponseCount(driver, 'registerBlockedInvalidEmail'), 0);
    await expectRegistrationToStayOnForm(driver);
  });
});
