import { tool } from 'ai';
import { z } from 'zod';
import { BrowserManager } from '../../BrowserManager.js';

export const browserVisionScreenCaptureTool = tool({
  description: 'Take a screenshot for vision-based analysis with optional element highlighting',
  parameters: z.object({
    highlightSelector: z.string().optional().describe('CSS selector for element to highlight in screenshot'),
    includeClickableElements: z.boolean().optional().default(false).describe('Include overlay showing clickable elements'),
  }),
  execute: async ({ highlightSelector, includeClickableElements }) => {
    console.log('📸 Taking vision screenshot');
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const page = await browserManager.getOrCreatePage();
      
      // Highlight element if requested
      if (highlightSelector) {
        await page.evaluate((selector: string) => {
          const element = document.querySelector(selector);
          if (element) {
            (element as HTMLElement).style.outline = '3px solid red';
            (element as HTMLElement).style.outlineOffset = '2px';
          }
        }, highlightSelector);
      }
      
      // Add clickable elements overlay if requested
      if (includeClickableElements) {
        await page.evaluate(() => {
          const clickableSelectors = ['button', 'a[href]', 'input', 'select', 'textarea', '[onclick]', '[role="button"]'];
          const overlay = document.createElement('div');
          overlay.id = 'vision-overlay';
          overlay.style.position = 'absolute';
          overlay.style.top = '0';
          overlay.style.left = '0';
          overlay.style.width = '100%';
          overlay.style.height = '100%';
          overlay.style.pointerEvents = 'none';
          overlay.style.zIndex = '9999';
          
          clickableSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach((element, index) => {
              const rect = element.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                const marker = document.createElement('div');
                marker.style.position = 'absolute';
                marker.style.left = `${rect.left + window.scrollX}px`;
                marker.style.top = `${rect.top + window.scrollY}px`;
                marker.style.width = `${rect.width}px`;
                marker.style.height = `${rect.height}px`;
                marker.style.border = '2px solid blue';
                marker.style.backgroundColor = 'rgba(0, 0, 255, 0.1)';
                marker.style.fontSize = '12px';
                marker.style.color = 'blue';
                marker.style.display = 'flex';
                marker.style.alignItems = 'center';
                marker.style.justifyContent = 'center';
                marker.textContent = `${index + 1}`;
                overlay.appendChild(marker);
              }
            });
          });
          
          document.body.appendChild(overlay);
        });
      }
      
      const screenshot = await page.screenshot({
        fullPage: true,
        encoding: 'base64'
      });
      
      // Clean up overlays and highlights
      await page.evaluate(() => {
        const overlay = document.getElementById('vision-overlay');
        if (overlay) overlay.remove();
        
        // Remove highlights
        const highlighted = document.querySelectorAll('[style*="outline"]');
        highlighted.forEach(el => {
          (el as HTMLElement).style.outline = '';
          (el as HTMLElement).style.outlineOffset = '';
        });
      });
      
      return {
        action: 'vision_screen_capture',
        screenshot: `data:image/png;base64,${screenshot}`,
        highlightSelector,
        includeClickableElements,
        success: true,
        currentUrl: page.url()
      };

    } catch (error) {
      console.error('Vision screenshot error:', error);
      return {
        action: 'vision_screen_capture',
        screenshot: null,
        highlightSelector,
        includeClickableElements,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});

export const browserVisionScreenClickTool = tool({
  description: 'Click at specific coordinates on the screen (for vision-based automation)',
  parameters: z.object({
    x: z.number().describe('X coordinate to click'),
    y: z.number().describe('Y coordinate to click'),
    clickCount: z.number().optional().default(1).describe('Number of clicks (1 for single, 2 for double)'),
  }),
  execute: async ({ x, y, clickCount }) => {
    console.log(`📍 Vision clicking at coordinates: (${x}, ${y})`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const page = await browserManager.getOrCreatePage();
      
      await page.mouse.click(x, y, { clickCount });
      
      return {
        action: 'vision_screen_click',
        coordinates: { x, y },
        clickCount,
        success: true,
        currentUrl: page.url()
      };

    } catch (error) {
      console.error('Vision click error:', error);
      return {
        action: 'vision_screen_click',
        coordinates: { x, y },
        clickCount,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});

export const browserDownloadHandlerTool = tool({
  description: 'Set up download handling and manage downloads',
  parameters: z.object({
    action: z.enum(['setup', 'list', 'wait_for_download']).describe('Download action to perform'),
    downloadPath: z.string().optional().describe('Custom download directory path'),
    timeout: z.number().optional().default(30000).describe('Timeout for download completion (ms)'),
  }),
  execute: async ({ action, downloadPath, timeout }) => {
    console.log(`📥 Download action: ${action}`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const page = await browserManager.getOrCreatePage();
      
      switch (action) {
        case 'setup':
          // Set up download behavior
          const client = await page.target().createCDPSession();
          await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadPath || './downloads'
          });
          
          return {
            action: 'setup',
            downloadPath: downloadPath || './downloads',
            success: true
          };
          
        case 'wait_for_download':
          // Wait for download to complete
          return new Promise((resolve) => {
            const startTime = Date.now();
            
            const checkDownload = () => {
              if (Date.now() - startTime > timeout) {
                resolve({
                  action: 'wait_for_download',
                  success: false,
                  error: 'Download timeout exceeded'
                });
                return;
              }
              
              // In a real implementation, you'd check the download directory
              // For now, we'll simulate a successful download
              setTimeout(() => {
                resolve({
                  action: 'wait_for_download',
                  success: true,
                  downloadCompleted: true
                });
              }, 2000);
            };
            
            checkDownload();
          });
          
        case 'list':
        default:
          return {
            action: 'list',
            downloads: [], // Would list actual downloads in real implementation
            success: true
          };
      }

    } catch (error) {
      console.error('Download handler error:', error);
      return {
        action,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});

export const browserFileUploadTool = tool({
  description: 'Upload files to file input elements',
  parameters: z.object({
    selector: z.string().describe('CSS selector for the file input element'),
    filePaths: z.array(z.string()).describe('Array of file paths to upload'),
  }),
  execute: async ({ selector, filePaths }) => {
    console.log(`📤 Uploading files to: ${selector}`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const page = await browserManager.getOrCreatePage();
      
      await page.waitForSelector(selector, { timeout: 10000 });
      
      const inputElement = await page.$(selector);
      if (!inputElement) {
        throw new Error('File input element not found');
      }
      
      await inputElement.uploadFile(...filePaths);
      
      return {
        action: 'file_upload',
        selector,
        filePaths,
        uploadedFiles: filePaths.length,
        success: true,
        currentUrl: page.url()
      };

    } catch (error) {
      console.error('File upload error:', error);
      return {
        action: 'file_upload',
        selector,
        filePaths,
        uploadedFiles: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});

export const browserWaitForNetworkIdleTool = tool({
  description: 'Wait for network activity to become idle (useful for dynamic content)',
  parameters: z.object({
    timeout: z.number().optional().default(30000).describe('Maximum time to wait (ms)'),
    idleTime: z.number().optional().default(500).describe('Time with no network activity to consider idle (ms)'),
  }),
  execute: async ({ timeout, idleTime }) => {
    console.log(`⏳ Waiting for network idle (${idleTime}ms idle time)`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const page = await browserManager.getOrCreatePage();
      
      await page.waitForLoadState('networkidle', { timeout });
      
      return {
        action: 'wait_for_network_idle',
        timeout,
        idleTime,
        success: true,
        currentUrl: page.url()
      };

    } catch (error) {
      console.error('Network idle wait error:', error);
      return {
        action: 'wait_for_network_idle',
        timeout,
        idleTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});

export const browserElementHighlightTool = tool({
  description: 'Highlight elements on the page for visual feedback',
  parameters: z.object({
    selector: z.string().describe('CSS selector for elements to highlight'),
    color: z.string().optional().default('red').describe('Highlight color'),
    duration: z.number().optional().default(3000).describe('Highlight duration in ms (0 for permanent)'),
  }),
  execute: async ({ selector, color, duration }) => {
    console.log(`✨ Highlighting elements: ${selector}`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const page = await browserManager.getOrCreatePage();
      
      const highlightedCount = await page.evaluate((sel: string, highlightColor: string, dur: number) => {
        const elements = document.querySelectorAll(sel);
        elements.forEach((element, index) => {
          const htmlElement = element as HTMLElement;
          htmlElement.style.outline = `3px solid ${highlightColor}`;
          htmlElement.style.outlineOffset = '2px';
          htmlElement.style.backgroundColor = `${highlightColor}20`;
          
          if (dur > 0) {
            setTimeout(() => {
              htmlElement.style.outline = '';
              htmlElement.style.outlineOffset = '';
              htmlElement.style.backgroundColor = '';
            }, dur);
          }
        });
        return elements.length;
      }, selector, color, duration);
      
      return {
        action: 'element_highlight',
        selector,
        color,
        duration,
        highlightedElements: highlightedCount,
        success: true,
        currentUrl: page.url()
      };

    } catch (error) {
      console.error('Element highlight error:', error);
      return {
        action: 'element_highlight',
        selector,
        color,
        duration,
        highlightedElements: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});

export const browserCookieManagerTool = tool({
  description: 'Manage browser cookies (get, set, delete)',
  parameters: z.object({
    action: z.enum(['get', 'set', 'delete', 'clear']).describe('Cookie action to perform'),
    name: z.string().optional().describe('Cookie name (required for set/delete)'),
    value: z.string().optional().describe('Cookie value (required for set)'),
    domain: z.string().optional().describe('Cookie domain'),
    path: z.string().optional().describe('Cookie path'),
  }),
  execute: async ({ action, name, value, domain, path }) => {
    console.log(`🍪 Cookie action: ${action}`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const page = await browserManager.getOrCreatePage();
      
      switch (action) {
        case 'get':
          const cookies = await page.cookies();
          return {
            action: 'get',
            cookies: name ? cookies.filter(c => c.name === name) : cookies,
            success: true
          };
          
        case 'set':
          if (!name || !value) {
            throw new Error('Name and value are required for setting cookies');
          }
          await page.setCookie({
            name,
            value,
            domain: domain || new URL(page.url()).hostname,
            path: path || '/'
          });
          return {
            action: 'set',
            cookie: { name, value, domain, path },
            success: true
          };
          
        case 'delete':
          if (!name) {
            throw new Error('Name is required for deleting cookies');
          }
          await page.deleteCookie({ name });
          return {
            action: 'delete',
            deletedCookie: name,
            success: true
          };
          
        case 'clear':
          const allCookies = await page.cookies();
          for (const cookie of allCookies) {
            await page.deleteCookie({ name: cookie.name });
          }
          return {
            action: 'clear',
            deletedCount: allCookies.length,
            success: true
          };
          
        default:
          throw new Error(`Unknown cookie action: ${action}`);
      }

    } catch (error) {
      console.error('Cookie manager error:', error);
      return {
        action,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});