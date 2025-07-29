import { tool } from 'ai';
import { z } from 'zod';
import axios from 'axios';
import { BrowserManager } from '../../services/BrowserManager.js';
import { researchSessions } from './types.js';

// Search Tool
export const searchTool = tool({
  description: 'Perform enhanced web search with domain filtering and query optimization for research',
  parameters: z.object({
    query: z.string().describe('The search query'),
    maxResults: z.number().optional().default(10).describe('Maximum number of results'),
    domains: z.array(z.string()).optional().describe('Specific domains to search within'),
    excludeDomains: z.array(z.string()).optional().describe('Domains to exclude from search'),
    searchEngine: z.enum(['duckduckgo', 'google', 'bing']).optional().default('duckduckgo').describe('Search engine to use'),
    sessionId: z.string().optional().describe('Research session ID for tracking')
  }),
  execute: async ({ query, maxResults, domains, excludeDomains, searchEngine, sessionId }, { abortSignal }) => {
    console.log(`🔍 Search: "${query}" using ${searchEngine}`);
    
    try {
      // Optimize query for better results
      let optimizedQuery = query.trim();
      
      // Add domain filters if specified
      if (domains && domains.length > 0) {
        const domainFilter = domains.map(d => `site:${d}`).join(' OR ');
        optimizedQuery += ` (${domainFilter})`;
      }
      
      if (excludeDomains && excludeDomains.length > 0) {
        const excludeFilter = excludeDomains.map(d => `-site:${d}`).join(' ');
        optimizedQuery += ` ${excludeFilter}`;
      }
      
      // Use DuckDuckGo search (same as existing webSearchTool but enhanced)
      const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(optimizedQuery)}&format=json&no_html=1&skip_disambig=1`;
      const response = await axios.get(searchUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'DeepResearch-Agent/1.0'
        },
        signal: abortSignal
      });
      
      const data = response.data;
      const results = [];
      
      // Process instant answers
      if (data.Abstract) {
        results.push({
          title: data.Heading || 'Direct Answer',
          url: data.AbstractURL || 'https://duckduckgo.com',
          snippet: data.Abstract,
          domain: data.AbstractSource || 'duckduckgo.com',
          publishedDate: new Date().toISOString(),
          relevanceScore: 1.0,
          type: 'instant_answer'
        });
      }
      
      // Process related topics
      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        for (const topic of data.RelatedTopics.slice(0, maxResults - results.length)) {
          if (topic.Text && topic.FirstURL) {
            const domain = new URL(topic.FirstURL).hostname;
            
            // Apply domain filters
            if (domains && domains.length > 0 && !domains.some(d => domain.includes(d))) {
              continue;
            }
            if (excludeDomains && excludeDomains.some(d => domain.includes(d))) {
              continue;
            }
            
            results.push({
              title: topic.Result ? topic.Result.split(' - ')[0] : 'Related Topic',
              url: topic.FirstURL,
              snippet: topic.Text,
              domain,
              publishedDate: new Date().toISOString(),
              relevanceScore: 0.8,
              type: 'related_topic'
            });
          }
        }
      }
      
      // Fallback to browser search if needed
      if (results.length < 3) {
        try {
          const browserManager = BrowserManager.getInstance();
          const cdpEndpoint = await BrowserManager.discoverBrowser();
          
          if (!browserManager.isLaunchingComplete()) {
            await browserManager.launchBrowser({
              cdpEndpoint: cdpEndpoint || undefined,
              headless: true,
            });
          }
          
          const page = await browserManager.getOrCreatePage();
          await page.goto(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(optimizedQuery)}`, {
            waitUntil: 'networkidle2',
            timeout: 30000
          });
          
          const searchResults = await page.evaluate(() => {
            const results = [];
            const resultElements = document.querySelectorAll('.result');
            
            for (const element of Array.from(resultElements).slice(0, 8)) {
              const titleElement = element.querySelector('.result__title a');
              const snippetElement = element.querySelector('.result__snippet');
              
              if (titleElement && snippetElement) {
                const url = titleElement.href || '';
                const domain = url ? new URL(url).hostname : '';
                
                results.push({
                  title: titleElement.textContent?.trim() || '',
                  url,
                  snippet: snippetElement.textContent?.trim() || '',
                  domain,
                  publishedDate: new Date().toISOString(),
                  relevanceScore: 0.7,
                  type: 'web_result'
                });
              }
            }
            
            return results;
          });
          
          // Apply domain filters to browser results
          const filteredResults = searchResults.filter(result => {
            if (domains && domains.length > 0 && !domains.some(d => result.domain.includes(d))) {
              return false;
            }
            if (excludeDomains && excludeDomains.some(d => result.domain.includes(d))) {
              return false;
            }
            return true;
          });
          
          results.push(...filteredResults.slice(0, maxResults - results.length));
        } catch (browserError) {
          console.error('Browser search fallback failed:', browserError);
        }
      }
      
      // Update session tracking if provided
      if (sessionId && researchSessions.has(sessionId)) {
        const session = researchSessions.get(sessionId)!;
        results.forEach(result => {
          if (result.url) {
            session.visitedUrls.add(result.url);
          }
        });
      }
      
      return {
        query: optimizedQuery,
        originalQuery: query,
        results: results.slice(0, maxResults),
        totalResults: results.length,
        searchEngine,
        domains: domains || [],
        excludeDomains: excludeDomains || [],
        timestamp: new Date().toISOString(),
        sessionId,
        type: 'enhanced_search'
      };
      
    } catch (error) {
      console.error('Enhanced search error:', error);
      return {
        query,
        results: [],
        totalResults: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        type: 'enhanced_search'
      };
    }
  }
});