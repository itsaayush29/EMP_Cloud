import fs from 'node:fs/promises';
import path from 'node:path';
import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import { describe, it, afterEach } from 'mocha';
import dotenv from 'dotenv';
import { invoiceData } from '../../data/invoice-data.js';
import { login } from '../../utils/auth.js';

dotenv.config({ quiet: true });

const authFile = 'playwright/.auth/user.json';
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

async function saveAuthState(driver, filePath) {
  const cookies = await driver.manage().getCookies();
  const origin = new URL(baseUrl).origin;
  const localStorage = await driver.executeScript(`
    return Object.entries(window.localStorage).map(([name, value]) => ({ name, value }));
  `);
  const sessionStorage = await driver.executeScript(`
    return Object.entries(window.sessionStorage).map(([name, value]) => ({ name, value }));
  `);

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(
    filePath,
    JSON.stringify(
      {
        cookies,
        origins: [
          {
            origin,
            localStorage,
            sessionStorage,
          },
        ],
      },
      null,
      2
    )
  );
}

describe('authenticate once for protected modules', function () {
  this.timeout(120000);

  let driver;

  afterEach(async () => {
    if (driver) {
      await driver.quit();
      driver = undefined;
    }
  });

  it('authenticate once for protected modules', async function () {
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

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .setChromeService(new chrome.ServiceBuilder(driverPath))
      .build();

    console.log('Creating shared authenticated session...');
    await login(driver, invoiceData.login);
    await saveAuthState(driver, authFile); // Replaces Playwright storageState() with a Selenium session snapshot.
    console.log(`Saved authenticated session to ${authFile}`);
  });
});
