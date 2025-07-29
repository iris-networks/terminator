import { tool } from 'ai';
import { z } from 'zod';
import { BrowserManager } from '../../BrowserManager.js';

export const browserClickTool = tool({
  description: 'Click on an element in the browser',
  parameters: z.object({
    selector: z.string().describe('CSS selector for the element to click'),
    waitForSelector: z.boolean().optional().default(true).describe('Wait for selector to be available'),
    timeout: z.number().optional().default(10000).describe('Timeout in milliseconds'),
  }),
  execute: async ({ selector, waitForSelector, timeout }) => {
    console.log(`🖱️ Clicking element: ${selector}`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const page = await browserManager.getOrCreatePage();
      
      if (waitForSelector) {
        await page.waitForSelector(selector, { timeout });
      }
      
      await page.click(selector);
      
      return {
        action: 'click',
        selector,
        success: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Browser click error:', error);
      return {
        action: 'click',
        selector,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
    }
  },
});

export const browserHoverTool = tool({
  description: 'Hover over an element in the browser',
  parameters: z.object({
    selector: z.string().describe('CSS selector for the element to hover over'),
    waitForSelector: z.boolean().optional().default(true).describe('Wait for selector to be available'),
    timeout: z.number().optional().default(10000).describe('Timeout in milliseconds'),
  }),
  execute: async ({ selector, waitForSelector, timeout }) => {
    console.log(`👆 Hovering over element: ${selector}`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const page = await browserManager.getOrCreatePage();
      
      if (waitForSelector) {
        await page.waitForSelector(selector, { timeout });
      }
      
      await page.hover(selector);
      
      return {
        action: 'hover',
        selector,
        success: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Browser hover error:', error);
      return {
        action: 'hover',
        selector,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
    }
  },
});

export const browserDoubleClickTool = tool({
  description: 'Double-click on an element in the browser',
  parameters: z.object({
    selector: z.string().describe('CSS selector for the element to double-click'),
    waitForSelector: z.boolean().optional().default(true).describe('Wait for selector to be available'),
    timeout: z.number().optional().default(10000).describe('Timeout in milliseconds'),
  }),
  execute: async ({ selector, waitForSelector, timeout }) => {
    console.log(`🖱️🖱️ Double-clicking element: ${selector}`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const page = await browserManager.getOrCreatePage();
      
      if (waitForSelector) {
        await page.waitForSelector(selector, { timeout });
      }
      
      await page.click(selector, { clickCount: 2 });
      
      return {
        action: 'double_click',
        selector,
        success: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Browser double-click error:', error);
      return {
        action: 'double_click',
        selector,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
    }
  },
});

export const browserRightClickTool = tool({
  description: 'Right-click on an element in the browser',
  parameters: z.object({
    selector: z.string().describe('CSS selector for the element to right-click'),
    waitForSelector: z.boolean().optional().default(true).describe('Wait for selector to be available'),
    timeout: z.number().optional().default(10000).describe('Timeout in milliseconds'),
  }),
  execute: async ({ selector, waitForSelector, timeout }) => {
    console.log(`🖱️➡️ Right-clicking element: ${selector}`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const page = await browserManager.getOrCreatePage();
      
      if (waitForSelector) {
        await page.waitForSelector(selector, { timeout });
      }
      
      await page.click(selector, { button: 'right' });
      
      return {
        action: 'right_click',
        selector,
        success: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Browser right-click error:', error);
      return {
        action: 'right_click',
        selector,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
    }
  },
});

export const browserDragAndDropTool = tool({
  description: 'Drag an element from one location to another',
  parameters: z.object({
    sourceSelector: z.string().describe('CSS selector for the element to drag'),
    targetSelector: z.string().describe('CSS selector for the drop target'),
    timeout: z.number().optional().default(10000).describe('Timeout in milliseconds'),
  }),
  execute: async ({ sourceSelector, targetSelector, timeout }) => {
    console.log(`🫱 Drag and drop: ${sourceSelector} -> ${targetSelector}`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const page = await browserManager.getOrCreatePage();
      
      await page.waitForSelector(sourceSelector, { timeout });
      await page.waitForSelector(targetSelector, { timeout });
      
      const sourceElement = await page.$(sourceSelector);
      const targetElement = await page.$(targetSelector);
      
      if (!sourceElement || !targetElement) {
        throw new Error('Source or target element not found');
      }
      
      const sourceBox = await sourceElement.boundingBox();
      const targetBox = await targetElement.boundingBox();
      
      if (!sourceBox || !targetBox) {
        throw new Error('Could not get bounding box for elements');
      }
      
      await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
      await page.mouse.up();
      
      return {
        action: 'drag_and_drop',
        sourceSelector,
        targetSelector,
        success: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Browser drag and drop error:', error);
      return {
        action: 'drag_and_drop',
        sourceSelector,
        targetSelector,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
    }
  },
});