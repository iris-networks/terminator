/*
 * Copyright 2025 hivelogic pvt ltd, singapore
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { tool } from 'ai';
import { z } from 'zod';
import axios from 'axios';
import { researchSessions, saveSession } from './types.js';

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
      
      // Note: Browser fallback removed - now handled by MCP browser tools
      
      // Update session tracking if provided
      if (sessionId && researchSessions.has(sessionId)) {
        const session = researchSessions.get(sessionId)!;
        results.forEach(result => {
          if (result.url) {
            session.visitedUrls.add(result.url);
          }
        });
        saveSession(sessionId, session);
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
        type: 'search'
      };
      
    } catch (error) {
      console.error('Enhanced search error:', error);
      return {
        query,
        results: [],
        totalResults: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        type: 'search'
      };
    }
  }
});