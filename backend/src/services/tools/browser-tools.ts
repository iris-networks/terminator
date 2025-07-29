import { tool } from 'ai';
import { z } from 'zod';
import path from 'path';
import { BrowserManager } from '../BrowserManager.js';
import { PaginatedContentExtractor } from '../ContentExtractor.js';
import { ensureWorkspace, WORKSPACE_PATH } from './utils/workspace.js';

// Browser automation tool using @agent-infra/browser
export const browserActionTool = tool({
  description: 'Perform browser actions like navigating, clicking, typing, extracting content, or taking screenshots',
  parameters: z.object({
    action: z.enum(['navigate', 'click', 'type', 'extract', 'screenshot', 'scroll', 'wait']).describe('The action to perform'),
    url: z.string().optional().describe('URL to navigate to (required for navigate action)'),
    selector: z.string().optional().describe('CSS selector for the element (required for click, type, extract actions)'),
    text: z.string().optional().describe('Text to type (required for type action)'),
    extractType: z.enum(['text', 'html', 'attributes', 'markdown']).optional().default('text').describe('What to extract (for extract action)'),
    waitTime: z.number().optional().default(3000).describe('Time to wait in milliseconds (for wait action)'),
    scrollDirection: z.enum(['up', 'down', 'top', 'bottom']).optional().default('down').describe('Scroll direction (for scroll action)'),
    screenshotType: z.enum(['fullpage', 'viewport']).optional().default('viewport').describe('Screenshot type (for screenshot action)')
  }),
  execute: async ({ action, url, selector, text, extractType, waitTime, scrollDirection, screenshotType }) => {
    console.log(`🌐 Browser action: ${action}`);
    
    const startTime = Date.now();
    const browserManager = BrowserManager.getInstance();
    
    try {
      // Auto-discover existing browser or prepare for local launch
      const cdpEndpoint = await BrowserManager.discoverBrowser();
      
      // Ensure browser is ready
      if (!browserManager.isLaunchingComplete()) {
        await browserManager.launchBrowser({
          cdpEndpoint: cdpEndpoint || undefined,
          headless: true,
        });
      } else {
        await browserManager.ensureBrowserReady();
      }

      // Get or create a page using the BrowserManager helper method
      const page = await browserManager.getOrCreatePage();

      let result: any = { action, success: true, timestamp: new Date().toISOString() };

      switch (action) {
        case 'navigate':
          if (!url) throw new Error('URL is required for navigate action');
          
          await page.goto(url, { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
          });
          
          result = {
            ...result,
            navigatedTo: url,
            title: await page.title(),
            finalUrl: page.url()
          };
          break;

        case 'click':
          if (!selector) throw new Error('Selector is required for click action');
          
          await page.waitForSelector(selector, { timeout: 10000 });
          await page.click(selector);
          
          result = {
            ...result,
            targetElement: selector,
            clicked: true
          };
          break;

        case 'type':
          if (!selector) throw new Error('Selector is required for type action');
          if (!text) throw new Error('Text is required for type action');
          
          await page.waitForSelector(selector, { timeout: 10000 });
          await page.focus(selector);
          await page.keyboard.down('Meta');
          await page.keyboard.press('a');
          await page.keyboard.up('Meta');
          await page.type(selector, text, { delay: 50 });
          
          result = {
            ...result,
            targetElement: selector,
            inputText: text,
            typed: true
          };
          break;

        case 'extract':
          if (!selector) throw new Error('Selector is required for extract action');
          
          await page.waitForSelector(selector, { timeout: 10000 });
          
          let extractedData;
          switch (extractType) {
            case 'text':
              extractedData = await page.$eval(selector, el => el.textContent?.trim() || '');
              break;
            case 'html':
              extractedData = await page.$eval(selector, el => el.innerHTML);
              break;
            case 'attributes':
              extractedData = await page.$eval(selector, el => {
                const attrs: Record<string, string> = {};
                for (const attr of el.attributes) {
                  attrs[attr.name] = attr.value;
                }
                return attrs;
              });
              break;
            case 'markdown':
              // Simple markdown extraction
              extractedData = await page.$eval(selector, el => {
                // Convert basic HTML elements to markdown
                let content = el.innerHTML;
                content = content.replace(/<h([1-6])>/g, (_, level) => '#'.repeat(parseInt(level)) + ' ');
                content = content.replace(/<\/h[1-6]>/g, '\n\n');
                content = content.replace(/<strong>|<b>/g, '**');
                content = content.replace(/<\/strong>|<\/b>/g, '**');
                content = content.replace(/<em>|<i>/g, '*');
                content = content.replace(/<\/em>|<\/i>/g, '*');
                content = content.replace(/<a[^>]+href="([^"]+)"[^>]*>/g, '[');
                content = content.replace(/<\/a>/g, ']($1)');
                content = content.replace(/<br\s*\/?>/g, '\n');
                content = content.replace(/<p>/g, '');
                content = content.replace(/<\/p>/g, '\n\n');
                content = content.replace(/<[^>]+>/g, ''); // Remove remaining tags
                return content.trim();
              });
              break;
          }
          
          result = {
            ...result,
            targetElement: selector,
            extractType,
            extractedData
          };
          break;

        case 'screenshot':
          await ensureWorkspace();
          const screenshotPath = path.join(WORKSPACE_PATH, `screenshot_${Date.now()}.png`);
          
          await page.screenshot({
            path: screenshotPath,
            fullPage: screenshotType === 'fullpage',
            type: 'png'
          });
          
          result = {
            ...result,
            screenshotPath,
            screenshotType,
            saved: true
          };
          break;

        case 'scroll':
          switch (scrollDirection) {
            case 'top':
              await page.evaluate(() => window.scrollTo(0, 0));
              break;
            case 'bottom':
              await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
              break;
            case 'up':
              await page.evaluate(() => window.scrollBy(0, -500));
              break;
            case 'down':
              await page.evaluate(() => window.scrollBy(0, 500));
              break;
          }
          
          result = {
            ...result,
            scrollDirection,
            scrolled: true
          };
          break;

        case 'wait':
          await page.waitForTimeout(waitTime);
          
          result = {
            ...result,
            waitTime,
            waited: true
          };
          break;

        default:
          throw new Error(`Unknown browser action: ${action}`);
      }

      result.duration = Date.now() - startTime;
      return result;

    } catch (error) {
      console.error('Browser action error:', error);
      
      // Try to recover browser on error
      try {
        await browserManager.recoverBrowser();
      } catch (recoveryError) {
        console.error('Browser recovery failed:', recoveryError);
      }
      
      return {
        action,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        ...(url && { attemptedUrl: url }),
        ...(selector && { attemptedSelector: selector }),
      };
    }
  },
});

// Browser get markdown tool with Readability support
export const browserGetMarkdownTool = tool({
  description: 'Get the content of the current page as markdown with pagination support using Mozilla Readability algorithm',
  parameters: z.object({
    page: z.number().optional().default(1).describe('Page number to extract (default: 1), in most cases, you do not need to pass this parameter.'),
  }),
  execute: async ({ page = 1 }) => {
    console.log(`🌐 Getting markdown content (page ${page})`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      
      // Try to discover existing browser first
      const cdpEndpoint = await BrowserManager.discoverBrowser();
      if (cdpEndpoint) {
        await browserManager.launchBrowser({ cdpEndpoint });
      } else {
        await browserManager.launchBrowser();
      }
      
      // Get or create a page using the BrowserManager helper method
      const browserPage = await browserManager.getOrCreatePage();
      
      // Create content extractor instance
      const contentExtractor = new PaginatedContentExtractor();
      
      // Extract content using the paginated extractor
      const result = await contentExtractor.extractContent(browserPage, page);
      
      console.log(`✅ Extracted markdown content: ${result.content.length} characters, page ${result.currentPage}/${result.totalPages}`);
      
      return {
        content: result.content,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          hasMorePages: result.hasMorePages,
        },
        title: result.title,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Browser get markdown error:', error);
      return {
        status: 'error',
        message: `Failed to extract content: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      };
    }
  },
});

// Individual browser interaction tools
export const browserClickTool = tool({
  description: 'Click on an element in the browser using CSS selector',
  parameters: z.object({
    selector: z.string().describe('CSS selector for the element to click'),
  }),
  execute: async ({ selector }) => {
    console.log(`🖱️ Clicking element: ${selector}`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const page = await browserManager.getOrCreatePage();
      
      await page.click(selector);
      
      console.log(`✅ Successfully clicked: ${selector}`);
      return {
        status: 'success',
        message: `Clicked element: ${selector}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Browser click error:', error);
      return {
        status: 'error',
        message: `Failed to click element: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      };
    }
  },
});

export const browserHoverTool = tool({
  description: 'Hover over an element in the browser using CSS selector',
  parameters: z.object({
    selector: z.string().describe('CSS selector for the element to hover over'),
  }),
  execute: async ({ selector }) => {
    console.log(`👆 Hovering over element: ${selector}`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const page = await browserManager.getOrCreatePage();
      
      await page.hover(selector);
      
      console.log(`✅ Successfully hovered: ${selector}`);
      return {
        status: 'success',
        message: `Hovered over element: ${selector}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Browser hover error:', error);
      return {
        status: 'error',
        message: `Failed to hover over element: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      };
    }
  },
});

export const browserPressKeyTool = tool({
  description: 'Press a key or key combination in the browser',
  parameters: z.object({
    key: z.string().describe('Key to press (e.g., "Enter", "Escape", "Tab", "ctrl+a", "cmd+s")'),
  }),
  execute: async ({ key }) => {
    console.log(`⌨️ Pressing key: ${key}`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const page = await browserManager.getOrCreatePage();
      
      // Handle key combinations
      if (key.includes('+')) {
        const keys = key.split('+');
        const modifiers = keys.slice(0, -1);
        const mainKey = keys[keys.length - 1];
        
        // Press modifier keys
        for (const modifier of modifiers) {
          await page.keyboard.down(modifier);
        }
        
        // Press main key
        await page.keyboard.press(mainKey);
        
        // Release modifier keys
        for (const modifier of modifiers.reverse()) {
          await page.keyboard.up(modifier);
        }
      } else {
        await page.keyboard.press(key);
      }
      
      console.log(`✅ Successfully pressed key: ${key}`);
      return {
        status: 'success',
        message: `Pressed key: ${key}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Browser key press error:', error);
      return {
        status: 'error',
        message: `Failed to press key: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      };
    }
  },
});

export const browserFormInputFillTool = tool({
  description: 'Fill a form input field with text',
  parameters: z.object({
    selector: z.string().describe('CSS selector for the input field'),
    text: z.string().describe('Text to fill into the input field'),
    clear: z.boolean().optional().default(true).describe('Whether to clear the field first'),
  }),
  execute: async ({ selector, text, clear = true }) => {
    console.log(`📝 Filling input field: ${selector} with "${text}"`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const page = await browserManager.getOrCreatePage();
      
      if (clear) {
        await page.click(selector, { clickCount: 3 }); // Select all text
      }
      
      await page.type(selector, text);
      
      console.log(`✅ Successfully filled input: ${selector}`);
      return {
        status: 'success',
        message: `Filled input field: ${selector} with "${text}"`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Browser form fill error:', error);
      return {
        status: 'error',
        message: `Failed to fill input field: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      };
    }
  },
});