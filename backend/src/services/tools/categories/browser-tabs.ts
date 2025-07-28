import { tool } from 'ai';
import { z } from 'zod';
import { BrowserManager } from '../../BrowserManager.js';
import type { BrowserTabInfo } from '../core/types.js';

export const browserPressKeyTool = tool({
  description: 'Press a key or key combination in the browser',
  parameters: z.object({
    key: z.string().describe('Key or key combination to press (e.g., "Enter", "ctrl+a", "cmd+s")'),
    selector: z.string().optional().describe('CSS selector to focus before pressing key (optional)'),
  }),
  execute: async ({ key, selector }) => {
    console.log(`⌨️ Pressing key: ${key}`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const page = await browserManager.getOrCreatePage();
      
      // Focus on element if selector provided
      if (selector) {
        await page.waitForSelector(selector, { timeout: 10000 });
        await page.focus(selector);
      }
      
      // Handle key combinations
      const modifiers = [];
      let mainKey = key;
      
      if (key.includes('+')) {
        const parts = key.split('+');
        mainKey = parts[parts.length - 1];
        
        for (const part of parts.slice(0, -1)) {
          switch (part.toLowerCase()) {
            case 'ctrl':
            case 'control':
              modifiers.push('Control');
              break;
            case 'cmd':
            case 'meta':
              modifiers.push('Meta');
              break;
            case 'alt':
              modifiers.push('Alt');
              break;
            case 'shift':
              modifiers.push('Shift');
              break;
          }
        }
      }
      
      // Press modifiers
      for (const modifier of modifiers) {
        await page.keyboard.down(modifier);
      }
      
      // Press main key
      await page.keyboard.press(mainKey);
      
      // Release modifiers
      for (const modifier of modifiers.reverse()) {
        await page.keyboard.up(modifier);
      }
      
      return {
        key,
        selector,
        success: true,
        currentUrl: page.url()
      };

    } catch (error) {
      console.error('Key press error:', error);
      return {
        key,
        selector,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});

export const browserFormInputFillTool = tool({
  description: 'Fill a form input field with text',
  parameters: z.object({
    selector: z.string().describe('CSS selector for the input field'),
    text: z.string().describe('Text to fill in the input field'),
    clear: z.boolean().optional().default(true).describe('Clear the field before typing'),
  }),
  execute: async ({ selector, text, clear }) => {
    console.log(`📝 Filling input field: ${selector}`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const page = await browserManager.getOrCreatePage();
      
      await page.waitForSelector(selector, { timeout: 10000 });
      
      if (clear) {
        await page.click(selector, { clickCount: 3 }); // Select all
      }
      
      await page.type(selector, text);
      
      return {
        selector,
        text,
        clear,
        success: true,
        currentUrl: page.url()
      };

    } catch (error) {
      console.error('Form input fill error:', error);
      return {
        selector,
        text,
        clear,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});

export const browserTabListTool = tool({
  description: 'List all open browser tabs',
  parameters: z.object({}),
  execute: async () => {
    console.log('📋 Listing browser tabs');
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      
      const browser = browserManager.getBrowser();
      if (!browser) {
        throw new Error('No browser instance available');
      }
      
      // Handle different browser types
      let pages: any[] = [];
      if ('pages' in browser && typeof browser.pages === 'function') {
        pages = await browser.pages();
      } else {
        // Fallback for browsers without pages method
        const currentPage = await browserManager.getOrCreatePage();
        pages = [currentPage];
      }
      
      const tabs: BrowserTabInfo[] = await Promise.all(
        pages.map(async (page: any, index: number) => ({
          id: `tab-${index}`,
          url: page.url(),
          title: await page.title(),
          active: index === 0 // First page is typically active
        }))
      );
      
      return {
        tabs,
        totalTabs: tabs.length,
        success: true
      };

    } catch (error) {
      console.error('List tabs error:', error);
      return {
        tabs: [],
        totalTabs: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});

export const browserNewTabTool = tool({
  description: 'Create a new browser tab',
  parameters: z.object({
    url: z.string().optional().describe('URL to navigate to in the new tab'),
  }),
  execute: async ({ url }) => {
    console.log(`🆕 Creating new tab${url ? ` for: ${url}` : ''}`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      
      const browser = browserManager.getBrowser();
      if (!browser) {
        throw new Error('No browser instance available');
      }
      
      // Handle different browser types
      let page: any;
      if ('newPage' in browser && typeof browser.newPage === 'function') {
        page = await browser.newPage();
      } else {
        // Fallback - get or create a page
        page = await browserManager.getOrCreatePage();
      }
      
      // Set viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      );
      
      if (url) {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      }
      
      // Get tab index
      let pages: any[] = [];
      let tabIndex = 0;
      if ('pages' in browser && typeof browser.pages === 'function') {
        pages = await browser.pages();
        tabIndex = pages.indexOf(page);
      }
      
      return {
        tabId: `tab-${tabIndex}`,
        tabIndex,
        url: page.url(),
        title: await page.title(),
        success: true
      };

    } catch (error) {
      console.error('New tab error:', error);
      return {
        tabId: null,
        tabIndex: -1,
        url: url || '',
        title: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
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
      if (!browser) {
        throw new Error('No browser instance available');
      }
      
      // Handle different browser types
      let pages: any[] = [];
      if ('pages' in browser && typeof browser.pages === 'function') {
        pages = await browser.pages();
      } else {
        // Fallback for browsers without pages method
        const currentPage = await browserManager.getOrCreatePage();
        pages = [currentPage];
      }
      
      if (tabIndex < 0 || tabIndex >= pages.length) {
        throw new Error(`Invalid tab index: ${tabIndex}. Available tabs: 0-${pages.length - 1}`);
      }
      
      const pageToClose = pages[tabIndex];
      const url = pageToClose.url();
      const title = await pageToClose.title();
      
      await pageToClose.close();
      
      return {
        tabIndex,
        closedTab: {
          url,
          title
        },
        remainingTabs: pages.length - 1,
        success: true
      };

    } catch (error) {
      console.error('Close tab error:', error);
      return {
        tabIndex,
        closedTab: null,
        remainingTabs: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
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
      if (!browser) {
        throw new Error('No browser instance available');
      }
      
      // Handle different browser types
      let pages: any[] = [];
      if ('pages' in browser && typeof browser.pages === 'function') {
        pages = await browser.pages();
      } else {
        // Fallback for browsers without pages method
        const currentPage = await browserManager.getOrCreatePage();
        pages = [currentPage];
      }
      
      if (tabIndex < 0 || tabIndex >= pages.length) {
        throw new Error(`Invalid tab index: ${tabIndex}. Available tabs: 0-${pages.length - 1}`);
      }
      
      const targetPage = pages[tabIndex];
      await targetPage.bringToFront();
      
      return {
        tabIndex,
        activeTab: {
          url: targetPage.url(),
          title: await targetPage.title()
        },
        success: true
      };

    } catch (error) {
      console.error('Switch tab error:', error);
      return {
        tabIndex,
        activeTab: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});