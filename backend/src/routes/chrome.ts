import { Router } from 'express';
import { connect } from 'puppeteer-real-browser';
import * as path from 'path';
import * as os from 'os';

const router = Router();

// Shared Chrome user data directory - matches MCP config tilde expansion
const CHROME_USER_DATA_DIR = path.join(os.homedir(), '.terminator-chrome-profile');

// Standard Chrome debugging port for consistency with MCP server
const CHROME_DEBUG_PORT = 9222;


router.post('/open', async (req, res) => {
  try {
    console.log('Opening Chrome with puppeteer-real-browser...');
    
    // Use puppeteer-real-browser to launch a real, undetectable browser
    const { browser, page } = await connect({
      headless: false,
      args: [
        `--user-data-dir=${CHROME_USER_DATA_DIR}`,
        `--remote-debugging-port=${CHROME_DEBUG_PORT}`,
        '--kiosk'
      ],
      turnstile: true,
      connectOption: {
        defaultViewport: null
      },
      disableXvfb: true,
      ignoreAllFlags: false
    });

    // Navigate to DuckDuckGo
    await page.goto('https://duckduckgo.com', {
      waitUntil: 'networkidle2'
    });

    // Get screen dimensions and adjust viewport
    const screenSize = await page.evaluate(() => {
      return {
        width: window.screen.width,
        height: window.screen.height,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight
      };
    });
    
    console.log('Detected screen size:', screenSize);

    // Keep the browser open (don't close it)
    console.log('Chrome opened successfully with puppeteer-real-browser');

    res.json({
      success: true,
      message: 'Chrome opened successfully with puppeteer-real-browser',
      userDataDir: CHROME_USER_DATA_DIR,
      debugPort: CHROME_DEBUG_PORT,
      screenSize: screenSize
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