import { tool } from 'ai';
import { z } from 'zod';
import { BrowserManager } from '../BrowserManager.js';

// Tab management tools
export const browserTabListTool = tool({
  description: 'List all open browser tabs',
  parameters: z.object({}),
  execute: async () => {
    console.log('📑 Listing browser tabs');
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const browser = browserManager.getBrowser();
      const puppeteerBrowser = browser.getBrowser();
      
      const pages = await puppeteerBrowser.pages();
      const tabs = await Promise.all(
        pages.map(async (page, index) => ({
          id: index,
          url: page.url(),
          title: await page.title().catch(() => 'Unknown'),
          active: !page.isClosed()
        }))
      );
      
      console.log(`✅ Found ${tabs.length} tabs`);
      return {
        status: 'success',
        tabs,
        count: tabs.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Browser tab list error:', error);
      return {
        status: 'error',
        message: `Failed to list tabs: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      };
    }
  },
});

export const browserNewTabTool = tool({
  description: 'Create a new browser tab',
  parameters: z.object({
    url: z.string().optional().describe('URL to navigate to in the new tab (optional)'),
  }),
  execute: async ({ url }) => {
    console.log(`🆕 Creating new tab${url ? ` and navigating to: ${url}` : ''}`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const browser = browserManager.getBrowser();
      
      const page = await browser.createPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      if (url) {
        await page.goto(url);
      }
      
      console.log(`✅ Created new tab${url ? ` at: ${url}` : ''}`);
      return {
        status: 'success',
        message: `Created new tab${url ? ` and navigated to: ${url}` : ''}`,
        url: url || 'about:blank',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Browser new tab error:', error);
      return {
        status: 'error',
        message: `Failed to create new tab: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      };
    }
  },
});

export const browserCloseTabTool = tool({
  description: 'Close a specific browser tab by index',
  parameters: z.object({
    tabIndex: z.number().describe('Index of the tab to close (0-based)'),
  }),
  execute: async ({ tabIndex }) => {
    console.log(`❌ Closing tab at index: ${tabIndex}`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const browser = browserManager.getBrowser();
      const puppeteerBrowser = browser.getBrowser();
      
      const pages = await puppeteerBrowser.pages();
      
      if (tabIndex < 0 || tabIndex >= pages.length) {
        throw new Error(`Tab index ${tabIndex} out of range. Available tabs: 0-${pages.length - 1}`);
      }
      
      const pageToClose = pages[tabIndex];
      const url = pageToClose.url();
      
      if (!pageToClose.isClosed()) {
        await pageToClose.close();
      }
      
      console.log(`✅ Closed tab at index ${tabIndex}: ${url}`);
      return {
        status: 'success',
        message: `Closed tab at index ${tabIndex}: ${url}`,
        closedUrl: url,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Browser close tab error:', error);
      return {
        status: 'error',
        message: `Failed to close tab: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      };
    }
  },
});

export const browserSwitchTabTool = tool({
  description: 'Switch to a specific browser tab by index',
  parameters: z.object({
    tabIndex: z.number().describe('Index of the tab to switch to (0-based)'),
  }),
  execute: async ({ tabIndex }) => {
    console.log(`🔄 Switching to tab at index: ${tabIndex}`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const browser = browserManager.getBrowser();
      const puppeteerBrowser = browser.getBrowser();
      
      const pages = await puppeteerBrowser.pages();
      
      if (tabIndex < 0 || tabIndex >= pages.length) {
        throw new Error(`Tab index ${tabIndex} out of range. Available tabs: 0-${pages.length - 1}`);
      }
      
      const targetPage = pages[tabIndex];
      const url = targetPage.url();
      
      // Bring the target page to front
      await targetPage.bringToFront();
      
      console.log(`✅ Switched to tab at index ${tabIndex}: ${url}`);
      return {
        status: 'success',
        message: `Switched to tab at index ${tabIndex}: ${url}`,
        activeUrl: url,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Browser switch tab error:', error);
      return {
        status: 'error',
        message: `Failed to switch tab: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      };
    }
  },
});