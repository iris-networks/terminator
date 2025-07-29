import { tool } from 'ai';
import { z } from 'zod';
import { BrowserManager } from '../../BrowserManager.js';

export const browserGoBackTool = tool({
  description: 'Navigate back in browser history',
  parameters: z.object({}),
  execute: async () => {
    console.log('🔙 Browser go back');
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const page = await browserManager.getOrCreatePage();
      
      await page.goBack({ waitUntil: 'networkidle2', timeout: 30000 });
      
      return {
        action: 'go_back',
        url: page.url(),
        title: await page.title(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Browser go back error:', error);
      return {
        action: 'go_back',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
    }
  },
});

export const browserGoForwardTool = tool({
  description: 'Navigate forward in browser history',
  parameters: z.object({}),
  execute: async () => {
    console.log('🔜 Browser go forward');
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const page = await browserManager.getOrCreatePage();
      
      await page.goForward({ waitUntil: 'networkidle2', timeout: 30000 });
      
      return {
        action: 'go_forward',
        url: page.url(),
        title: await page.title(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Browser go forward error:', error);
      return {
        action: 'go_forward',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
    }
  },
});