import { Router } from 'express';
import puppeteer from 'puppeteer';
import { BrowserFinder } from '@agent-infra/browser-finder';
import * as path from 'path';
import * as os from 'os';

const router = Router();

// Shared Chrome user data directory
const CHROME_USER_DATA_DIR = path.join(os.homedir(), '.terminator-chrome-profile');

router.post('/open', async (req, res) => {
  try {
    console.log('Opening Chrome with Puppeteer...');
    
    // Find Chrome executable using @agent-infra/browser-finder
    let executablePath;
    try {
      const chromeInfo = new BrowserFinder().findBrowser('chrome');
      executablePath = chromeInfo.path;
      console.log('Found Chrome at:', executablePath);
    } catch (error) {
      console.warn('Could not find Chrome executable:', error);
      executablePath = undefined; // Let Puppeteer find Chrome
    }

    // Launch Chrome with shared user data directory
    const browser = await puppeteer.launch({
      userDataDir: CHROME_USER_DATA_DIR,
      executablePath: executablePath,
      headless: false, // Always run headed
      args: [
        `--user-data-dir=${CHROME_USER_DATA_DIR}`,
        '--no-first-run',
        '--disable-default-apps',
        '--disable-popup-blocking',
        '--start-maximized'
      ],
    });

    // Open a new page to Google
    const page = await browser.newPage();
    await page.goto('https://google.com');

    // Keep the browser open (don't close it)
    console.log('Chrome opened successfully with shared profile');

    res.json({
      success: true,
      message: 'Chrome opened successfully',
      userDataDir: CHROME_USER_DATA_DIR,
      executablePath: executablePath
    });
  } catch (error) {
    console.error('Failed to open Chrome:', error);
    res.status(500).json({
      error: 'Failed to open Chrome',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as chromeRouter };