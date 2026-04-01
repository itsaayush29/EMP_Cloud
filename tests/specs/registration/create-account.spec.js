import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import { describe, it, beforeEach, afterEach } from 'mocha';
import dotenv from 'dotenv';
import { registrationScenarios } from '../../data/registration-scenarios.js';
import { safeClick, safeFill } from '../../utils/ui-helpers.js';

dotenv.config({ quiet: true });

const baseUrl = process.env.BASE_URL || 'https://test-billing.empcloud.com';

async function resolveChromePaths() {
  const browserCandidates = [
    process.env.CHROME_BIN,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ].filter(Boolean);

  let browserPath;

  for (const candidate of browserCandidates) {
    try {
      await fs.access(candidate);
      browserPath = candidate;
      break;
    } catch {
      // Try the next Chrome location.
    }
  }

  if (!browserPath) {
    throw new Error('Unable to locate chrome.exe. Set CHROME_BIN to your Chrome executable path.');
  }

  const driverRoot = path.join(process.env.USERPROFILE || '', '.cache', 'selenium', 'chromedriver', 'win64');
  const driverVersions = await fs.readdir(driverRoot, { withFileTypes: true });
  const versionNames = driverVersions.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  const latestVersion = versionNames.at(-1);

  if (!latestVersion) {
    throw new Error('Unable to locate a cached ChromeDriver. Run Selenium Manager once or install ChromeDriver.');
  }

  return {
    driverPath: path.join(driverRoot, latestVersion, 'chromedriver.exe'),
    browserPath,
  };
}

async function createDriver() {
  const options = new chrome.Options();
  const { driverPath, browserPath } = await resolveChromePaths();
  const profileDir = await fs.mkdtemp(path.join(process.cwd(), '.tmp-chrome-profile-'));

  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-gpu');
  options.addArguments('--remote-debugging-port=0');
  options.addArguments(`--user-data-dir=${profileDir}`);
  options.addArguments('--no-first-run');
  options.addArguments('--no-default-browser-check');

  if (process.env.HEADLESS !== 'false') {
    options.addArguments('--headless=new');
  }

  options.setChromeBinaryPath(browserPath);

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .setChromeService(new chrome.ServiceBuilder(driverPath))
    .build();

  return { driver, profileDir };
}

async function captureFailure(driver, prefix) {
  try {
    const screenshot = await driver.takeScreenshot();
    const outputPath = `test-results/${prefix}-${Date.now()}.png`;
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, screenshot, 'base64');
  } catch {
    // Ignore screenshot failures after teardown.
  }
}

async function openRegistrationPage(driver) {
  console.log('Opening login page...');
  await driver.get(new URL('/login', baseUrl).href);
  const signInHeading = await driver.wait(
    until.elementLocated(By.xpath("//h1[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'sign in')]")),
    30000
  );
  await driver.wait(until.elementIsVisible(signInHeading), 30000);

  console.log('Opening registration form...');
  await safeClick(
    driver,
    By.xpath(
      "//a[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'create one free')]"
    ),
    'create one free link'
  );

  const createAccountHeading = await driver.wait(
    until.elementLocated(
      By.xpath("//h1[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'create account')]")
    ),
    30000
  );
  await driver.wait(until.elementIsVisible(createAccountHeading), 30000);
}

function fieldXpath(fieldText) {
  const lowered = fieldText.toLowerCase();
  return (
    `//input[` +
    `contains(translate(@aria-label, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${lowered}')` +
    ` or contains(translate(@placeholder, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${lowered}')` +
    `]` +
    ` | //label[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${lowered}')]/following::*[self::input or self::textarea][1]` +
    ` | //*[contains(@class, 'form') or contains(@class, 'field')][.//label[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${lowered}')]]//*[self::input or self::textarea][1]`
  );
}

async function fillRegistrationForm(driver, user) {
  const firstName = By.xpath(`${fieldXpath('first name')} | //input[@name='firstName']`);
  const lastName = By.xpath(`${fieldXpath('last name')} | //input[@name='lastName']`);
  const workEmail = By.xpath(`${fieldXpath('work email')} | //input[@name='workEmail'] | //input[@type='email']`);
  const organizationName = By.xpath(
    `${fieldXpath('organization name')} | //input[@name='organizationName'] | //input[@name='organization']`
  );
  const password = By.xpath(`${fieldXpath('password')} | //input[@name='password'] | //input[@type='password']`);

  if (user.firstName) {
    await safeFill(driver, firstName, user.firstName, 'first name');
  }

  if (user.lastName) {
    await safeFill(driver, lastName, user.lastName, 'last name');
  }

  if (user.workEmail) {
    await safeFill(driver, workEmail, user.workEmail, 'work email');
  }

  if (user.organizationName) {
    await safeFill(driver, organizationName, user.organizationName, 'organization name');
  }

  if (user.password) {
    await safeFill(driver, password, user.password, 'password');
  }

  return {
    firstName,
    lastName,
    workEmail,
    organizationName,
    password,
  };
}

async function expectFieldToBeInvalid(driver, locator) {
  const element = await driver.wait(until.elementLocated(locator), 30000);
  await driver.wait(async () => !(await driver.executeScript('return arguments[0].checkValidity();', element)), 30000);
}

async function trackRegistrationResponse(driver) {
  await driver.executeScript(`
    window.__empRegisterResponseStatus = null;
    window.__empRegisterResponseError = null;

    if (!window.__empRegisterFetchPatched) {
      const originalFetch = window.fetch.bind(window);
      window.fetch = async (...args) => {
        const response = await originalFetch(...args);
        try {
          const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
          if (url && url.includes('/auth/register')) {
            window.__empRegisterResponseStatus = response.status;
          }
        } catch (error) {
          window.__empRegisterResponseError = error?.message || String(error);
        }
        return response;
      };
      window.__empRegisterFetchPatched = true;
    }

    if (!window.__empRegisterXhrPatched) {
      const originalOpen = XMLHttpRequest.prototype.open;
      const originalSend = XMLHttpRequest.prototype.send;

      XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        this.__empMethod = method;
        this.__empUrl = url;
        return originalOpen.call(this, method, url, ...rest);
      };

      XMLHttpRequest.prototype.send = function(...args) {
        this.addEventListener('loadend', function() {
          try {
            if (this.__empUrl && String(this.__empUrl).includes('/auth/register') && String(this.__empMethod).toUpperCase() === 'POST') {
              window.__empRegisterResponseStatus = this.status;
            }
          } catch (error) {
            window.__empRegisterResponseError = error?.message || String(error);
          }
        });

        return originalSend.apply(this, args);
      };

      window.__empRegisterXhrPatched = true;
    }
  `);
}

async function waitForRegistrationResponse(driver) {
  await driver.wait(async () => {
    const status = await driver.executeScript('return window.__empRegisterResponseStatus;');
    return status !== null;
  }, 30000);

  return driver.executeScript('return window.__empRegisterResponseStatus;');
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
    if (driver) {
      await driver.quit().catch(() => {});
      driver = undefined;
    }

    if (profileDir) {
      await fs.rm(profileDir, { recursive: true, force: true }).catch(() => {});
      profileDir = undefined;
    }
  });

  it(registrationScenarios.validRegistration.name, async function () {
    try {
      await openRegistrationPage(driver);
      await fillRegistrationForm(driver, registrationScenarios.validRegistration.user);
      await trackRegistrationResponse(driver);

      await safeClick(
        driver,
        By.xpath(
          "//button[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'create free account')]"
        ),
        'create free account button'
      );
      console.log('Waiting for registration result...');

      const responseStatus = await waitForRegistrationResponse(driver); // Replaces Playwright waitForResponse() with browser-side network tracking.
      assert.equal(responseStatus, 201, `Expected registration API status to be 201, received ${responseStatus}.`);
    } catch (error) {
      console.error('Registration flow failed:', error.message);
      await captureFailure(driver, 'registration-error');
      throw error;
    }
  });

  it(registrationScenarios.missingFirstName.name, async function () {
    await openRegistrationPage(driver);
    const fields = await fillRegistrationForm(driver, registrationScenarios.missingFirstName.user);

    await safeClick(
      driver,
      By.xpath(
        "//button[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'create free account')]"
      ),
      'create free account button'
    );

    await expectFieldToBeInvalid(driver, fields.firstName);
    const createAccountHeading = await driver.findElement(
      By.xpath("//h1[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'create account')]")
    );
    assert.equal(await createAccountHeading.isDisplayed(), true);
  });

  it(registrationScenarios.invalidEmail.name, async function () {
    await openRegistrationPage(driver);
    const fields = await fillRegistrationForm(driver, registrationScenarios.invalidEmail.user);

    await safeClick(
      driver,
      By.xpath(
        "//button[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'create free account')]"
      ),
      'create free account button'
    );

    await expectFieldToBeInvalid(driver, fields.workEmail);
    const createAccountHeading = await driver.findElement(
      By.xpath("//h1[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'create account')]")
    );
    assert.equal(await createAccountHeading.isDisplayed(), true);
  });
});
