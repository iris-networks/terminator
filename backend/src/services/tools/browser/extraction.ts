import { tool } from 'ai';
import { z } from 'zod';
import { BrowserManager } from '../../BrowserManager.js';
import { PaginatedContentExtractor } from '../../ContentExtractor.js';

export const browserGetMarkdownTool = tool({
  description: 'Extract content from the current page as markdown using Mozilla Readability',
  parameters: z.object({
    page: z.number().optional().default(1).describe('Page number for pagination'),
    simplify: z.boolean().optional().default(true).describe('Use Readability to simplify content'),
  }),
  execute: async ({ page = 1, simplify }) => {
    console.log(`📄 Extracting markdown content (page ${page}, simplify: ${simplify})`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const browserPage = await browserManager.getOrCreatePage();
      
      if (simplify) {
        const contentExtractor = new PaginatedContentExtractor();
        const result = await contentExtractor.extractContent(browserPage, page);
        
        return {
          content: result.content,
          pagination: {
            currentPage: result.currentPage,
            totalPages: result.totalPages,
            hasMorePages: result.hasMorePages,
          },
          title: result.title,
          url: browserPage.url(),
          timestamp: new Date().toISOString()
        };
      } else {
        const content = await browserPage.evaluate(() => document.body.textContent || '');
        const title = await browserPage.title();
        
        return {
          content,
          title,
          url: browserPage.url(),
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('❌ Browser get markdown error:', error);
      return {
        content: '',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
    }
  },
});

export const browserGetLinksTool = tool({
  description: 'Extract all links from the current page',
  parameters: z.object({
    includeInternal: z.boolean().optional().default(true).describe('Include internal links'),
    includeExternal: z.boolean().optional().default(true).describe('Include external links'),
    filterPattern: z.string().optional().describe('Regex pattern to filter links'),
  }),
  execute: async ({ includeInternal, includeExternal, filterPattern }) => {
    console.log('🔗 Extracting links from page');
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const page = await browserManager.getOrCreatePage();
      
      const currentUrl = page.url();
      const currentDomain = new URL(currentUrl).hostname;
      
      const links = await page.evaluate((currentDomain, includeInternal, includeExternal) => {
        const linkElements = Array.from(document.querySelectorAll('a[href]'));
        return linkElements.map(a => {
          const href = a.href;
          const text = a.textContent?.trim() || '';
          const isInternal = href.includes(currentDomain) || href.startsWith('/');
          
          return {
            href,
            text,
            isInternal,
            title: a.title || '',
            target: a.target || ''
          };
        }).filter(link => {
          if (!includeInternal && link.isInternal) return false;
          if (!includeExternal && !link.isInternal) return false;
          return true;
        });
      }, currentDomain, includeInternal, includeExternal);
      
      let filteredLinks = links;
      if (filterPattern) {
        const regex = new RegExp(filterPattern, 'i');
        filteredLinks = links.filter(link => regex.test(link.href) || regex.test(link.text));
      }
      
      return {
        links: filteredLinks,
        totalLinks: filteredLinks.length,
        internalLinks: filteredLinks.filter(l => l.isInternal).length,
        externalLinks: filteredLinks.filter(l => !l.isInternal).length,
        url: currentUrl,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Browser get links error:', error);
      return {
        links: [],
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
    }
  },
});

export const browserGetClickableElementsTool = tool({
  description: 'Find all clickable elements on the current page',
  parameters: z.object({
    elementTypes: z.array(z.enum(['button', 'link', 'input', 'all'])).optional().default(['all']).describe('Types of clickable elements to find'),
    visibleOnly: z.boolean().optional().default(true).describe('Only return visible elements'),
  }),
  execute: async ({ elementTypes, visibleOnly }) => {
    console.log('🖱️ Finding clickable elements');
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const page = await browserManager.getOrCreatePage();
      
      const elements = await page.evaluate((elementTypes, visibleOnly) => {
        const selectors: string[] = [];
        
        if (elementTypes.includes('all') || elementTypes.includes('button')) {
          selectors.push('button', 'input[type="button"]', 'input[type="submit"]', '[role="button"]');
        }
        if (elementTypes.includes('all') || elementTypes.includes('link')) {
          selectors.push('a[href]');
        }
        if (elementTypes.includes('all') || elementTypes.includes('input')) {
          selectors.push('input[type="checkbox"]', 'input[type="radio"]', 'select');
        }
        
        const allElements = document.querySelectorAll(selectors.join(', '));
        
        return Array.from(allElements).map((el, index) => {
          const rect = el.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0 && 
                           window.getComputedStyle(el).visibility !== 'hidden' &&
                           window.getComputedStyle(el).display !== 'none';
          
          if (visibleOnly && !isVisible) return null;
          
          const tagName = el.tagName.toLowerCase();
          let elementType = 'other';
          if (tagName === 'button' || el.getAttribute('role') === 'button') elementType = 'button';
          else if (tagName === 'a') elementType = 'link';
          else if (tagName === 'input' || tagName === 'select') elementType = 'input';
          
          return {
            index,
            tagName,
            elementType,
            text: el.textContent?.trim() || '',
            href: el.getAttribute('href') || '',
            id: el.id || '',
            className: el.className || '',
            isVisible,
            boundingBox: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height
            }
          };
        }).filter(el => el !== null);
      }, elementTypes, visibleOnly);
      
      return {
        elements,
        totalElements: elements.length,
        elementCounts: {
          buttons: elements.filter(el => el.elementType === 'button').length,
          links: elements.filter(el => el.elementType === 'link').length,
          inputs: elements.filter(el => el.elementType === 'input').length,
        },
        url: page.url(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Browser get clickable elements error:', error);
      return {
        elements: [],
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
    }
  },
});