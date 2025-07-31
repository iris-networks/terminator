import { tool } from 'ai';
import { z } from 'zod';
import { researchSessions, saveSession, ContentCollection } from './types.js';

export const visitLinkTool = tool({
  description: 'Visit and extract detailed content from web pages with enhanced analysis',
  parameters: z.object({
    url: z.string().describe('URL to visit and extract content from'),
    extractionMode: z.enum(['full', 'summary', 'structured']).optional().default('full').describe('Content extraction mode'),
    extractImages: z.boolean().optional().default(false).describe('Extract images from the page'),
    focusAreas: z.array(z.string()).optional().describe('Specific topics or areas to focus on'),
    sessionId: z.string().optional().describe('Research session ID for tracking')
  }),
  execute: async ({ url, extractionMode, extractImages, focusAreas, sessionId }, { abortSignal }) => {
    console.log(`🌐 Visit: ${url} (mode: ${extractionMode})`);
    
    try {
      // Note: Browser functionality now handled by MCP browser tools
      // This tool is deprecated - use MCP browser tools directly instead
      throw new Error('This tool is deprecated. Use MCP browser tools (browser_navigate, browser_get_content) instead.');
      
    } catch (error) {
      console.error('Enhanced visit error:', error);
      return {
        url,
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        type: 'enhanced_visit'
      };
    }
  }
});