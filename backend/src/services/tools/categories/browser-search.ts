import { tool } from 'ai';
import { z } from 'zod';
import { BrowserManager } from '../../BrowserManager.js';
import { PaginatedContentExtractor } from '../../ContentExtractor.js';

export const browserSearchTool = tool({
  description: 'Perform web searches using different search engines through browser automation',
  parameters: z.object({
    query: z.string().describe('Search query'),
    engine: z.enum(['google', 'bing', 'duckduckgo', 'baidu']).optional().default('google').describe('Search engine to use'),
    maxResults: z.number().optional().default(10).describe('Maximum number of results to extract'),
    extractContent: z.boolean().optional().default(false).describe('Extract content from result pages'),
  }),
  execute: async ({ query, engine, maxResults, extractContent }) => {
    console.log(`🔍 Searching ${engine} for: ${query}`);
    
    try {
      const browserManager = BrowserManager.getInstance();
      await browserManager.ensureBrowserReady();
      const page = await browserManager.getOrCreatePage();
      
      // Define search engine URLs and selectors
      const searchEngines = {
        google: {
          url: 'https://www.google.com/search',
          queryParam: 'q',
          resultSelector: 'div[data-ved] h3',
          linkSelector: 'div[data-ved] h3 a',
          snippetSelector: 'div[data-ved] .VwiC3b'
        },
        bing: {
          url: 'https://www.bing.com/search',
          queryParam: 'q',
          resultSelector: '.b_algo h2',
          linkSelector: '.b_algo h2 a',
          snippetSelector: '.b_algo .b_caption p'
        },
        duckduckgo: {
          url: 'https://duckduckgo.com',
          queryParam: 'q',
          resultSelector: 'article h2',
          linkSelector: 'article h2 a',
          snippetSelector: 'article .result__snippet'
        },
        baidu: {
          url: 'https://www.baidu.com/s',
          queryParam: 'wd',
          resultSelector: '.result h3',
          linkSelector: '.result h3 a',
          snippetSelector: '.result .c-abstract'
        }
      };
      
      const searchConfig = searchEngines[engine];
      const searchUrl = `${searchConfig.url}?${searchConfig.queryParam}=${encodeURIComponent(query)}`;
      
      // Navigate to search engine
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Extract search results
      const results = await page.evaluate((config, maxRes) => {
        const titles = Array.from(document.querySelectorAll(config.resultSelector));
        const links = Array.from(document.querySelectorAll(config.linkSelector));
        const snippets = Array.from(document.querySelectorAll(config.snippetSelector));
        
        const searchResults = [];
        const limit = Math.min(titles.length, maxRes);
        
        for (let i = 0; i < limit; i++) {
          const title = titles[i]?.textContent?.trim() || '';
          const link = (links[i] as HTMLAnchorElement)?.href || '';
          const snippet = snippets[i]?.textContent?.trim() || '';
          
          if (title && link) {
            searchResults.push({
              title,
              url: link,
              snippet,
              position: i + 1
            });
          }
        }
        
        return searchResults;
      }, searchConfig, maxResults);
      
      // Extract content from result pages if requested
      if (extractContent && results.length > 0) {
        const extractor = new PaginatedContentExtractor();
        
        for (const result of results.slice(0, 3)) { // Limit to first 3 results to avoid overwhelming
          try {
            await page.goto(result.url, { waitUntil: 'networkidle2', timeout: 15000 });
            const content = await extractor.extractContent(page, 1);
            result.extractedContent = {
              title: content.title,
              content: content.content.substring(0, 1000), // First 1000 chars
              wordCount: content.content.split(/\s+/).length
            };
          } catch (error) {
            result.extractedContent = {
              error: 'Failed to extract content'
            };
          }
        }
      }
      
      return {
        action: 'browser_search',
        query,
        engine,
        results,
        totalResults: results.length,
        extractedContent: extractContent,
        success: true,
        searchUrl
      };

    } catch (error) {
      console.error('Browser search error:', error);
      return {
        action: 'browser_search',
        query,
        engine,
        results: [],
        totalResults: 0,
        extractedContent: false,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});

export const browserConcurrentSearchTool = tool({
  description: 'Perform concurrent searches across multiple search engines',
  parameters: z.object({
    query: z.string().describe('Search query'),
    engines: z.array(z.enum(['google', 'bing', 'duckduckgo'])).optional().default(['google', 'bing']).describe('Search engines to use'),
    maxResultsPerEngine: z.number().optional().default(5).describe('Maximum results per engine'),
  }),
  execute: async ({ query, engines, maxResultsPerEngine }) => {
    console.log(`🔍 Concurrent search across ${engines.join(', ')} for: ${query}`);
    
    try {
      const searchPromises = engines.map(async (engine) => {
        // Create separate browser manager for each search to run concurrently
        const browserManager = BrowserManager.getInstance();
        await browserManager.ensureBrowserReady();
        const page = await browserManager.getOrCreatePage();
        
        const searchEngines = {
          google: {
            url: 'https://www.google.com/search',
            queryParam: 'q',
            resultSelector: 'div[data-ved] h3',
            linkSelector: 'div[data-ved] h3 a',
            snippetSelector: 'div[data-ved] .VwiC3b'
          },
          bing: {
            url: 'https://www.bing.com/search',
            queryParam: 'q',
            resultSelector: '.b_algo h2',
            linkSelector: '.b_algo h2 a',
            snippetSelector: '.b_algo .b_caption p'
          },
          duckduckgo: {
            url: 'https://duckduckgo.com',
            queryParam: 'q',
            resultSelector: 'article h2',
            linkSelector: 'article h2 a',
            snippetSelector: 'article .result__snippet'
          }
        };
        
        const searchConfig = searchEngines[engine];
        const searchUrl = `${searchConfig.url}?${searchConfig.queryParam}=${encodeURIComponent(query)}`;
        
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        
        const results = await page.evaluate((config, maxRes) => {
          const titles = Array.from(document.querySelectorAll(config.resultSelector));
          const links = Array.from(document.querySelectorAll(config.linkSelector));
          const snippets = Array.from(document.querySelectorAll(config.snippetSelector));
          
          const searchResults = [];
          const limit = Math.min(titles.length, maxRes);
          
          for (let i = 0; i < limit; i++) {
            const title = titles[i]?.textContent?.trim() || '';
            const link = (links[i] as HTMLAnchorElement)?.href || '';
            const snippet = snippets[i]?.textContent?.trim() || '';
            
            if (title && link) {
              searchResults.push({
                title,
                url: link,
                snippet,
                position: i + 1
              });
            }
          }
          
          return searchResults;
        }, searchConfig, maxResultsPerEngine);
        
        return {
          engine,
          results,
          totalResults: results.length
        };
      });
      
      const searchResults = await Promise.all(searchPromises);
      
      // Combine and deduplicate results
      const allResults = [];
      const seenUrls = new Set();
      
      for (const engineResult of searchResults) {
        for (const result of engineResult.results) {
          if (!seenUrls.has(result.url)) {
            seenUrls.add(result.url);
            allResults.push({
              ...result,
              source: engineResult.engine
            });
          }
        }
      }
      
      return {
        action: 'concurrent_search',
        query,
        engines,
        engineResults: searchResults,
        combinedResults: allResults,
        totalCombinedResults: allResults.length,
        success: true
      };

    } catch (error) {
      console.error('Concurrent search error:', error);
      return {
        action: 'concurrent_search',
        query,
        engines,
        engineResults: [],
        combinedResults: [],
        totalCombinedResults: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});