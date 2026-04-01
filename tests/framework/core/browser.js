import fs from 'node:fs/promises';
import path from 'node:path';
import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import { env } from '../config/env.js';

export async function resolveChromePaths() {
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
  let driverPath;

  try {
    const driverVersions = await fs.readdir(driverRoot, { withFileTypes: true });
    const versionNames = driverVersions.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
    const latestVersion = versionNames.at(-1);

    if (latestVersion) {
      driverPath = path.join(driverRoot, latestVersion, 'chromedriver.exe');
    }
  } catch {
    // Fall back to Selenium Manager when no cached ChromeDriver is present yet.
  }

  return {
    browserPath,
    driverPath,
  };
}

export async function createDriver() {
  const options = new chrome.Options();
  const { browserPath, driverPath } = await resolveChromePaths();
  const profileDir = await fs.mkdtemp(path.join(process.cwd(), '.tmp-chrome-profile-'));

  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-gpu');
  options.addArguments('--remote-debugging-port=0');
  options.addArguments(`--user-data-dir=${profileDir}`);
  options.addArguments('--no-first-run');
  options.addArguments('--no-default-browser-check');

  if (env.headless) {
    options.addArguments('--headless=new');
  }

  if (env.incognito) {
    options.addArguments('--incognito');
  }

  options.setChromeBinaryPath(browserPath);

  const builder = new Builder().forBrowser('chrome').setChromeOptions(options);

  if (driverPath) {
    builder.setChromeService(new chrome.ServiceBuilder(driverPath));
  }

  const driver = await builder.build();

  return { driver, profileDir };
}

export async function destroyDriver(driver, profileDir) {
  if (driver) {
    await driver.quit().catch(() => {});
  }

  if (profileDir) {
    await fs.rm(profileDir, { recursive: true, force: true }).catch(() => {});
  }
}
