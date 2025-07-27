import { tool } from 'ai';
import { z } from 'zod';
import puppeteer, { Browser, Page } from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Workspace management
const WORKSPACE_PATH = process.env.WORKSPACE_PATH || path.join(process.cwd(), 'workspace');
const SCREENSHOTS_PATH = path.join(WORKSPACE_PATH, 'screenshots');

async function ensureScreenshotsDir() {
  try {
    await fs.access(SCREENSHOTS_PATH);
  } catch {
    await fs.mkdir(SCREENSHOTS_PATH, { recursive: true });
  }
}

// Browser session management
class BrowserSession {
  public browser: Browser | null = null;
  public page: Page | null = null;
  public sessionId: string;
  
  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }
  
  async initialize() {
    if (this.browser) {
      return;
    }
    
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--window-size=1920,1080',
        '--start-maximized'
      ],
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    this.page = await this.browser.newPage();
    
    // Set user agent to avoid bot detection
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Enable request interception for performance
    await this.page.setRequestInterception(true);
    this.page.on('request', (req) => {
      // Block unnecessary resources for faster loading
      if (req.resourceType() === 'image' && !req.url().includes('screenshot')) {
        req.abort();
      } else {
        req.continue();
      }
    });
  }
  
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
  
  async takeScreenshot(name?: string): Promise<string> {
    if (!this.page) {
      throw new Error('Browser session not initialized');
    }
    
    await ensureScreenshotsDir();
    const screenshotName = name || `screenshot_${Date.now()}.png`;
    const screenshotPath = path.join(SCREENSHOTS_PATH, screenshotName);
    
    await this.page.screenshot({
      path: screenshotPath,
      fullPage: false,
      type: 'png'
    });
    
    return screenshotPath;
  }
}

// Session management
const browserSessions = new Map<string, BrowserSession>();

// Visual browser navigation tool
export const visualNavigateTool = tool({
  description: 'Navigate to a URL and take a screenshot for visual analysis',
  parameters: z.object({
    url: z.string().describe('URL to navigate to'),
    sessionId: z.string().optional().describe('Browser session ID (creates new if not provided)'),
    waitForSelector: z.string().optional().describe('CSS selector to wait for before taking screenshot'),
    waitTime: z.number().optional().default(3000).describe('Additional wait time in milliseconds')
  }),
  execute: async ({ url, sessionId, waitForSelector, waitTime }) => {
    console.log(`🌐 Visual navigation to: ${url}`);
    
    const currentSessionId = sessionId || uuidv4();
    
    try {
      let session = browserSessions.get(currentSessionId);
      if (!session) {
        session = new BrowserSession(currentSessionId);
        await session.initialize();
        browserSessions.set(currentSessionId, session);
      }
      
      if (!session.page) {
        throw new Error('Browser page not available');
      }
      
      // Navigate to URL
      await session.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      // Wait for specific selector if provided
      if (waitForSelector) {
        await session.page.waitForSelector(waitForSelector, { timeout: 10000 });
      }
      
      // Additional wait time
      await session.page.waitForTimeout(waitTime);
      
      // Take screenshot
      const screenshotPath = await session.takeScreenshot(`nav_${currentSessionId}_${Date.now()}.png`);
      
      // Extract page information
      const pageInfo = await session.page.evaluate(() => ({
        title: document.title,
        url: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }));
      
      return {
        success: true,
        sessionId: currentSessionId,
        url: pageInfo.url,
        title: pageInfo.title,
        screenshotPath,
        viewport: pageInfo.viewport,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        success: false,
        sessionId: currentSessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  },
});

// Visual element interaction tool
export const visualClickTool = tool({
  description: 'Click on an element by coordinates or selector with visual feedback',
  parameters: z.object({
    sessionId: z.string().describe('Browser session ID'),
    selector: z.string().optional().describe('CSS selector for the element to click'),
    coordinates: z.object({
      x: z.number(),
      y: z.number()
    }).optional().describe('Coordinates to click (alternative to selector)'),
    highlightElement: z.boolean().optional().default(true).describe('Highlight the target element before clicking'),
    takeScreenshotBefore: z.boolean().optional().default(true).describe('Take screenshot before clicking'),
    takeScreenshotAfter: z.boolean().optional().default(true).describe('Take screenshot after clicking')
  }),
  execute: async ({ sessionId, selector, coordinates, highlightElement, takeScreenshotBefore, takeScreenshotAfter }) => {
    console.log(`👆 Visual click in session: ${sessionId}`);
    
    const session = browserSessions.get(sessionId);
    if (!session || !session.page) {
      return {
        success: false,
        error: 'Browser session not found or not initialized',
        sessionId
      };
    }
    
    try {
      let beforeScreenshot = '';
      let afterScreenshot = '';
      let elementInfo = {};
      
      // Take before screenshot
      if (takeScreenshotBefore) {
        beforeScreenshot = await session.takeScreenshot(`before_click_${Date.now()}.png`);
      }
      
      if (selector) {
        // Wait for element to be visible
        await session.page.waitForSelector(selector, { visible: true, timeout: 10000 });
        
        // Get element information
        elementInfo = await session.page.$eval(selector, (el) => ({
          tagName: el.tagName,
          textContent: el.textContent?.trim().substring(0, 100),
          className: el.className,
          id: el.id,
          boundingBox: el.getBoundingClientRect()
        }));
        
        // Highlight element if requested
        if (highlightElement) {
          await session.page.$eval(selector, (el) => {
            el.style.outline = '3px solid red';
            el.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
          });
          await session.page.waitForTimeout(1000);
        }
        
        // Click the element
        await session.page.click(selector);
        
      } else if (coordinates) {
        // Click at coordinates
        await session.page.mouse.click(coordinates.x, coordinates.y);
        elementInfo = { clickedAt: coordinates };
        
      } else {
        throw new Error('Either selector or coordinates must be provided');
      }
      
      // Wait a moment for any page changes
      await session.page.waitForTimeout(2000);
      
      // Take after screenshot
      if (takeScreenshotAfter) {
        afterScreenshot = await session.takeScreenshot(`after_click_${Date.now()}.png`);
      }
      
      // Get updated page info
      const pageInfo = await session.page.evaluate(() => ({
        title: document.title,
        url: window.location.href
      }));
      
      return {
        success: true,
        sessionId,
        elementInfo,
        pageInfo,
        beforeScreenshot,
        afterScreenshot,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        success: false,
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  },
});

// Visual typing tool
export const visualTypeTool = tool({
  description: 'Type text into an input field with visual confirmation',
  parameters: z.object({
    sessionId: z.string().describe('Browser session ID'),
    selector: z.string().describe('CSS selector for the input element'),
    text: z.string().describe('Text to type'),
    clearFirst: z.boolean().optional().default(true).describe('Clear existing text before typing'),
    pressEnter: z.boolean().optional().default(false).describe('Press Enter after typing'),
    takeScreenshotAfter: z.boolean().optional().default(true).describe('Take screenshot after typing')
  }),
  execute: async ({ sessionId, selector, text, clearFirst, pressEnter, takeScreenshotAfter }) => {
    console.log(`⌨️ Visual typing in session: ${sessionId}`);
    
    const session = browserSessions.get(sessionId);
    if (!session || !session.page) {
      return {
        success: false,
        error: 'Browser session not found or not initialized',
        sessionId
      };
    }
    
    try {
      // Wait for element and focus
      await session.page.waitForSelector(selector, { visible: true, timeout: 10000 });
      await session.page.focus(selector);
      
      // Clear existing text if requested
      if (clearFirst) {
        await session.page.$eval(selector, (el: any) => {
          el.value = '';
          el.textContent = '';
        });
      }
      
      // Type text with realistic delay
      await session.page.type(selector, text, { delay: 50 });
      
      // Press Enter if requested
      if (pressEnter) {
        await session.page.keyboard.press('Enter');
        await session.page.waitForTimeout(1000);
      }
      
      // Get input field info
      const inputInfo = await session.page.$eval(selector, (el: any) => ({
        tagName: el.tagName,
        type: el.type,
        value: el.value,
        placeholder: el.placeholder,
        name: el.name,
        id: el.id
      }));
      
      let screenshotPath = '';
      if (takeScreenshotAfter) {
        screenshotPath = await session.takeScreenshot(`after_type_${Date.now()}.png`);
      }
      
      return {
        success: true,
        sessionId,
        inputInfo,
        typedText: text,
        screenshotPath,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        success: false,
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  },
});

// Visual page analysis tool
export const visualAnalyzeTool = tool({
  description: 'Analyze the current page visually and extract interactive elements',
  parameters: z.object({
    sessionId: z.string().describe('Browser session ID'),
    analysisType: z.enum(['interactive', 'content', 'layout', 'all']).optional().default('interactive').describe('Type of analysis to perform'),
    takeScreenshot: z.boolean().optional().default(true).describe('Take screenshot of current page')
  }),
  execute: async ({ sessionId, analysisType, takeScreenshot }) => {
    console.log(`🔍 Visual analysis in session: ${sessionId}`);
    
    const session = browserSessions.get(sessionId);
    if (!session || !session.page) {
      return {
        success: false,
        error: 'Browser session not found or not initialized',
        sessionId
      };
    }
    
    try {
      const analysis: any = {
        sessionId,
        analysisType,
        timestamp: new Date().toISOString()
      };
      
      // Take screenshot if requested
      if (takeScreenshot) {
        analysis.screenshotPath = await session.takeScreenshot(`analysis_${Date.now()}.png`);
      }
      
      // Get page info
      analysis.pageInfo = await session.page.evaluate(() => ({
        title: document.title,
        url: window.location.href,
        viewport: { width: window.innerWidth, height: window.innerHeight }
      }));
      
      if (analysisType === 'interactive' || analysisType === 'all') {
        // Find interactive elements
        analysis.interactiveElements = await session.page.evaluate(() => {
          const selectors = [
            'button', 'input', 'select', 'textarea', 'a[href]',
            '[onclick]', '[role="button"]', '.btn', '.button'
          ];
          
          const elements: any[] = [];
          
          selectors.forEach(selector => {
            const els = document.querySelectorAll(selector);
            els.forEach((el, index) => {
              const rect = el.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                elements.push({
                  selector: `${selector}:nth-of-type(${index + 1})`,
                  tagName: el.tagName,
                  type: (el as any).type,
                  textContent: el.textContent?.trim().substring(0, 50),
                  className: el.className,
                  id: el.id,
                  position: {
                    x: Math.round(rect.left),
                    y: Math.round(rect.top),
                    width: Math.round(rect.width),
                    height: Math.round(rect.height)
                  }
                });
              }
            });
          });
          
          return elements.slice(0, 20); // Limit to 20 elements
        });
      }
      
      if (analysisType === 'content' || analysisType === 'all') {
        // Analyze content
        analysis.content = await session.page.evaluate(() => {
          const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
            .map(h => ({
              level: h.tagName.toLowerCase(),
              text: h.textContent?.trim().substring(0, 100)
            }));
          
          const paragraphs = Array.from(document.querySelectorAll('p'))
            .slice(0, 5)
            .map(p => p.textContent?.trim().substring(0, 200));
          
          const images = Array.from(document.querySelectorAll('img'))
            .slice(0, 5)
            .map(img => ({
              src: (img as HTMLImageElement).src,
              alt: (img as HTMLImageElement).alt,
              width: (img as HTMLImageElement).width,
              height: (img as HTMLImageElement).height
            }));
          
          return { headings, paragraphs, images };
        });
      }
      
      if (analysisType === 'layout' || analysisType === 'all') {
        // Analyze layout
        analysis.layout = await session.page.evaluate(() => {
          const body = document.body;
          const bodyRect = body.getBoundingClientRect();
          
          return {
            bodyDimensions: {
              width: bodyRect.width,
              height: bodyRect.height,
              scrollHeight: document.body.scrollHeight
            },
            hasNavigation: !!document.querySelector('nav, .nav, .navigation, .navbar'),
            hasHeader: !!document.querySelector('header, .header'),
            hasFooter: !!document.querySelector('footer, .footer'),
            hasSidebar: !!document.querySelector('aside, .sidebar, .side-panel')
          };
        });
      }
      
      return {
        success: true,
        ...analysis
      };
      
    } catch (error) {
      return {
        success: false,
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  },
});

// Close browser session tool
export const closeBrowserSessionTool = tool({
  description: 'Close a browser session and cleanup resources',
  parameters: z.object({
    sessionId: z.string().describe('Browser session ID to close')
  }),
  execute: async ({ sessionId }) => {
    console.log(`❌ Closing browser session: ${sessionId}`);
    
    const session = browserSessions.get(sessionId);
    if (!session) {
      return {
        success: false,
        error: 'Browser session not found',
        sessionId
      };
    }
    
    try {
      await session.close();
      browserSessions.delete(sessionId);
      
      return {
        success: true,
        sessionId,
        message: 'Browser session closed successfully',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        success: false,
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  },
});

// List active browser sessions tool
export const listBrowserSessionsTool = tool({
  description: 'List all active browser sessions',
  parameters: z.object({}),
  execute: async () => {
    const sessions = Array.from(browserSessions.entries()).map(([id, session]) => ({
      sessionId: id,
      isActive: !!session.browser && !session.browser.process()?.killed,
      timestamp: new Date().toISOString()
    }));
    
    return {
      success: true,
      totalSessions: sessions.length,
      sessions,
      timestamp: new Date().toISOString()
    };
  },
});

// Export GUI Agent tools
export const guiAgentTools = {
  visual_navigate: visualNavigateTool,
  visual_click: visualClickTool,
  visual_type: visualTypeTool,
  visual_analyze: visualAnalyzeTool,
  close_browser_session: closeBrowserSessionTool,
  list_browser_sessions: listBrowserSessionsTool,
};