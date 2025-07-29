import { tool } from 'ai';
import { z } from 'zod';
import { BrowserManager } from '../../BrowserManager.js';
import { PaginatedContentExtractor } from '../../ContentExtractor.js';

export const browserActionTool = tool({
  description: 'Perform browser actions like navigation, clicking, typing, and content extraction',
  parameters: z.object({
    action: z.enum(['navigate', 'click', 'type', 'extract', 'screenshot', 'scroll', 'wait']).describe('The action to perform'),
    url: z.string().optional().describe('URL to navigate to (for navigate action)'),
    selector: z.string().optional().describe('CSS selector for the element to interact with'),
    text: z.string().optional().describe('Text to type (for type action)'),
    extractType: z.enum(['text', 'html', 'attributes', 'markdown']).optional().default('text').describe('Type of content extraction'),
    attribute: z.string().optional().describe('Attribute name to extract (when extractType is attributes)'),
    screenshotType: z.enum(['viewport', 'fullPage']).optional().default('viewport').describe('Screenshot type'),
    scrollDirection: z.enum(['up', 'down', 'left', 'right']).optional().default('down').describe('Scroll direction'),
    scrollAmount: z.number().optional().default(500).describe('Scroll amount in pixels'),
    waitTime: z.number().optional().default(1000).describe('Wait time in milliseconds'),
    waitSelector: z.string().optional().describe('CSS selector to wait for'),
  }),
  execute: async ({ action, url, selector, text, extractType, attribute, screenshotType, scrollDirection, scrollAmount, waitTime, waitSelector }) => {
    console.log(`🌐 Browser action: ${action}`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      
      // Auto-discover existing browser or prepare for local launch
      const cdpEndpoint = await BrowserManager.discoverBrowser();
      
      // Ensure browser is ready
      if (!browserManager.isLaunchingComplete()) {
        await browserManager.launchBrowser({
          cdpEndpoint: cdpEndpoint || undefined,
          headless: false, // Make browser visible for automation
        });
      } else {
        await browserManager.ensureBrowserReady();
      }

      // Get or create a page using the BrowserManager helper method
      const page = await browserManager.getOrCreatePage();

      switch (action) {
        case 'navigate':
          if (!url) throw new Error('URL is required for navigate action');
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
          return {
            action: 'navigate',
            url,
            currentUrl: page.url(),
            title: await page.title(),
            success: true
          };

        case 'click':
          if (!selector) throw new Error('Selector is required for click action');
          await page.waitForSelector(selector, { timeout: 10000 });
          await page.click(selector);
          return {
            action: 'click',
            selector,
            success: true,
            currentUrl: page.url()
          };

        case 'type':
          if (!selector || !text) throw new Error('Selector and text are required for type action');
          await page.waitForSelector(selector, { timeout: 10000 });
          await page.type(selector, text);
          return {
            action: 'type',
            selector,
            text,
            success: true,
            currentUrl: page.url()
          };

        case 'extract':
          let extractedContent;
          if (extractType === 'markdown') {
            // Use specialized markdown extraction
            const extractor = new PaginatedContentExtractor();
            const result = await extractor.extractContent(page, 1);
            extractedContent = result.content;
          } else {
            extractedContent = await page.evaluate((sel: string | undefined, type: string, attr: string | undefined) => {
              const element = sel ? document.querySelector(sel) : document;
              if (!element) return null;
              
              switch (type) {
                case 'text':
                  return element.textContent?.trim() || '';
                case 'html':
                  return element.innerHTML || '';
                case 'attributes':
                  return attr && 'getAttribute' in element ? (element as Element).getAttribute(attr) : null;
                default:
                  return element.textContent?.trim() || '';
              }
            }, selector, extractType, attribute);
          }
          
          return {
            action: 'extract',
            selector: selector || 'document',
            extractType,
            attribute,
            content: extractedContent,
            success: true,
            currentUrl: page.url()
          };

        case 'screenshot':
          const screenshot = await page.screenshot({
            fullPage: screenshotType === 'fullPage',
            encoding: 'base64'
          });
          return {
            action: 'screenshot',
            screenshotType,
            screenshot: `data:image/png;base64,${screenshot}`,
            success: true,
            currentUrl: page.url()
          };

        case 'scroll':
          await page.evaluate((direction: string, amount: number) => {
            const scrollMap = {
              down: [0, amount],
              up: [0, -amount],
              right: [amount, 0],
              left: [-amount, 0]
            };
            const [x, y] = scrollMap[direction as keyof typeof scrollMap];
            window.scrollBy(x, y);
          }, scrollDirection, scrollAmount);
          
          return {
            action: 'scroll',
            scrollDirection,
            scrollAmount,
            success: true,
            currentUrl: page.url()
          };

        case 'wait':
          if (waitSelector) {
            await page.waitForSelector(waitSelector, { timeout: waitTime + 5000 });
          } else {
            await page.waitForTimeout(waitTime);
          }
          
          return {
            action: 'wait',
            waitTime,
            waitSelector,
            success: true,
            currentUrl: page.url()
          };

        default:
          throw new Error(`Unknown action: ${action}`);
      }

    } catch (error) {
      console.error('Browser action error:', error);
      return {
        action,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});

export const browserEvaluateTool = tool({
  description: 'Execute JavaScript code in the browser context',
  parameters: z.object({
    code: z.string().describe('JavaScript code to execute'),
    returnValue: z.boolean().optional().default(true).describe('Whether to return the evaluation result'),
  }),
  execute: async ({ code, returnValue }) => {
    console.log('⚙️ Executing JavaScript in browser');
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const page = await browserManager.getOrCreatePage();
      
      const result = returnValue ? await page.evaluate(code) : await page.evaluate(code);
      
      return {
        action: 'evaluate',
        code,
        result: returnValue ? result : null,
        success: true,
        currentUrl: page.url(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Browser evaluate error:', error);
      return {
        action: 'evaluate',
        code,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
    }
  },
});