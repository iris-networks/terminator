import { tool } from 'ai';
import { z } from 'zod';
import axios from 'axios';
import { BrowserManager } from '../../BrowserManager.js';
import type { SearchResult } from '../core/types.js';

// Web search tool using DuckDuckGo API (no API key required)
export const webSearchTool = tool({
  description: 'Search the web for current information and recent developments',
  parameters: z.object({
    query: z.string().describe('The search query to look up'),
    maxResults: z.number().optional().default(10).describe('Maximum number of results to return'),
  }),
  execute: async ({ query, maxResults }) => {
    console.log(`🔍 Web search: "${query}"`);
    
    try {
      // Use DuckDuckGo Instant Answer API for quick results
      const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      const response = await axios.get(searchUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Agent-TARS/1.0'
        }
      });

      const data = response.data;
      const results: SearchResult[] = [];

      // Add abstract if available
      if (data.Abstract) {
        results.push({
          title: data.Heading || 'Direct Answer',
          url: data.AbstractURL || 'https://duckduckgo.com',
          snippet: data.Abstract,
          domain: data.AbstractSource || 'duckduckgo.com',
          publishedDate: new Date().toISOString(),
        });
      }

      // Add related topics
      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        for (const topic of data.RelatedTopics.slice(0, maxResults - results.length)) {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Result ? topic.Result.split(' - ')[0] : 'Related Topic',
              url: topic.FirstURL,
              snippet: topic.Text,
              domain: new URL(topic.FirstURL).hostname,
              publishedDate: new Date().toISOString(),
            });
          }
        }
      }

      // If no results from instant answers, use web search fallback
      if (results.length === 0) {
        // Fallback to web scraping using BrowserManager
        const browserManager = BrowserManager.getInstance();
        
        try {
          // Auto-discover existing browser or prepare for local launch
          const cdpEndpoint = await BrowserManager.discoverBrowser();
          
          // Ensure browser is ready
          if (!browserManager.isLaunchingComplete()) {
            await browserManager.launchBrowser({
              cdpEndpoint: cdpEndpoint || undefined,
              headless: false, // Make browser visible for web search
            });
          } else {
            await browserManager.ensureBrowserReady();
          }

          // Get or create a page using the BrowserManager helper method
          const page = await browserManager.getOrCreatePage();
          
          await page.goto(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
            waitUntil: 'networkidle2',
            timeout: 30000
          });

          const searchResults = await page.evaluate(() => {
            const results = [];
            const resultElements = document.querySelectorAll('.result');
            
            for (const element of Array.from(resultElements).slice(0, 10)) {
              const titleElement = element.querySelector('.result__title a') as HTMLAnchorElement;
              const snippetElement = element.querySelector('.result__snippet');
              
              if (titleElement && snippetElement) {
                results.push({
                  title: titleElement.textContent?.trim() || '',
                  url: titleElement.href || '',
                  snippet: snippetElement.textContent?.trim() || '',
                  domain: new URL(titleElement.href).hostname,
                  publishedDate: new Date().toISOString(),
                });
              }
            }
            
            return results;
          });

          results.push(...searchResults.slice(0, maxResults));
        } catch (browserError) {
          console.error('Browser search fallback failed:', browserError);
          // If browser fails, continue with empty results
        }
      }

      return {
        query,
        results: results.slice(0, maxResults),
        totalResults: results.length,
        searchTime: Date.now() / 1000,
        source: 'DuckDuckGo'
      };

    } catch (error) {
      console.error('Web search error:', error);
      return {
        query,
        results: [{
          title: 'Search Error',
          url: '',
          snippet: `Unable to perform web search for "${query}". Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          domain: 'error',
          publishedDate: new Date().toISOString(),
        }],
        totalResults: 1,
        searchTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
});