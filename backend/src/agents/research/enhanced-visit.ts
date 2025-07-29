import { tool } from 'ai';
import { z } from 'zod';
import { BrowserManager } from '../../services/BrowserManager.js';
import { researchSessions } from './types.js';

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
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const page = await browserManager.getOrCreatePage();
      
      // Check if aborted before navigation
      if (abortSignal?.aborted) {
        throw new Error('Operation aborted');
      }
      
      // Navigate to the URL
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      // Check if aborted after navigation
      if (abortSignal?.aborted) {
        throw new Error('Operation aborted');
      }
      
      // Extract page metadata
      const metadata = await page.evaluate(() => ({
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
        author: document.querySelector('meta[name="author"]')?.getAttribute('content') || '',
        publishDate: document.querySelector('meta[property="article:published_time"]')?.getAttribute('content') || 
                     document.querySelector('meta[name="date"]')?.getAttribute('content') || '',
        keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '',
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || window.location.href
      }));
      
      let content = '';
      let structuredData = {};
      let images: any[] = [];
      
      // Extract content based on mode
      switch (extractionMode) {
        case 'full':
          // Get full text content
          content = await page.evaluate(() => {
            // Remove script, style, and navigation elements
            const elementsToRemove = document.querySelectorAll('script, style, nav, header, footer, aside, .ad, .advertisement');
            elementsToRemove.forEach(el => el.remove());
            
            // Try to find main content area
            const mainContent = document.querySelector('main, article, .content, .post, .entry') || document.body;
            return mainContent.textContent?.trim() || '';
          });
          break;
          
        case 'summary':
          // Extract key paragraphs and headings
          content = await page.evaluate(() => {
            const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent?.trim()).filter(Boolean);
            const paragraphs = Array.from(document.querySelectorAll('p')).map(p => p.textContent?.trim()).filter(Boolean).slice(0, 5);
            
            return [...headings, ...paragraphs].join('\n\n');
          });
          break;
          
        case 'structured':
          // Extract structured data
          structuredData = await page.evaluate(() => {
            const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
              level: parseInt(h.tagName.charAt(1)),
              text: h.textContent?.trim() || ''
            }));
            
            const lists = Array.from(document.querySelectorAll('ul, ol')).map(list => ({
              type: list.tagName.toLowerCase(),
              items: Array.from(list.querySelectorAll('li')).map(li => li.textContent?.trim() || '')
            }));
            
            const tables = Array.from(document.querySelectorAll('table')).map(table => {
              const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent?.trim() || '');
              const rows = Array.from(table.querySelectorAll('tr')).slice(1).map(tr => 
                Array.from(tr.querySelectorAll('td')).map(td => td.textContent?.trim() || '')
              );
              return { headers, rows };
            });
            
            const links = Array.from(document.querySelectorAll('a[href]')).map(a => ({
              text: a.textContent?.trim() || '',
              href: a.href
            })).filter(link => link.text && link.href);
            
            return { headings, lists, tables, links };
          });
          
          content = JSON.stringify(structuredData, null, 2);
          break;
      }
      
      // Extract images if requested
      if (extractImages) {
        images = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('img')).map(img => ({
            src: img.src,
            alt: img.alt || '',
            title: img.title || '',
            width: img.width,
            height: img.height
          })).filter(img => img.src && !img.src.includes('data:image'));
        });
      }
      
      // Filter content by focus areas if specified
      let relevanceScore = 1.0;
      if (focusAreas && focusAreas.length > 0) {
        const lowerContent = content.toLowerCase();
        const matches = focusAreas.filter(area => lowerContent.includes(area.toLowerCase())).length;
        relevanceScore = matches / focusAreas.length;
      }
      
      // Update session tracking
      if (sessionId && researchSessions.has(sessionId)) {
        const session = researchSessions.get(sessionId)!;
        session.visitedUrls.add(url);
        
        if (images.length > 0) {
          session.collectedImages.push(...images.map(img => ({ ...img, sourceUrl: url })));
        }
      }
      
      return {
        url,
        metadata,
        content,
        structuredData: extractionMode === 'structured' ? structuredData : undefined,
        images,
        extractionMode,
        focusAreas: focusAreas || [],
        relevanceScore,
        contentLength: content.length,
        imageCount: images.length,
        timestamp: new Date().toISOString(),
        sessionId,
        type: 'enhanced_visit'
      };
      
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