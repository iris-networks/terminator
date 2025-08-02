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
import { searchTool } from './enhanced-search.js';
import { visitLinkTool } from './enhanced-visit.js';
import { researchSessions } from './types.js';

export const deepDiveTool = tool({
  description: 'Perform comprehensive research on a specific topic using multiple sources',
  parameters: z.object({
    topic: z.string().describe('The topic to research in-depth'),
    focusAreas: z.array(z.string()).describe('Specific areas to focus the research on'),
    maxSources: z.number().optional().default(5).describe('Maximum number of sources to analyze'),
    includeImages: z.boolean().optional().default(false).describe('Include relevant images in the research'),
    sessionId: z.string().describe('Research session ID')
  }),
  execute: async ({ topic, focusAreas, maxSources, includeImages, sessionId }, { abortSignal }) => {
    console.log(`🔬 Deep Dive: Researching "${topic}"`);
    
    try {
      const startTime = Date.now();
      const sources: any[] = [];
      const insights: string[] = [];
      
      // Step 1: Enhanced search for the topic
      console.log('📊 Step 1: Searching for sources...');
      const searchQuery = `${topic} ${focusAreas.join(' ')}`;
      
      // Use the search tool
      const searchResults = await searchTool.execute({
        query: searchQuery,
        maxResults: maxSources * 2, // Get more results to filter from
        sessionId,
        searchEngine: "duckduckgo"
      }, {
        messages: [],
        toolCallId: `search_${Date.now()}`,
        abortSignal
      });
      
      if (searchResults.results.length === 0) {
        return {
          topic,
          focusAreas,
          sources: [],
          insights: ['No sources found for the given topic'],
          status: 'no_sources',
          timestamp: new Date().toISOString(),
          sessionId,
          type: 'deep_dive'
        };
      }
      
      // Step 2: Visit and analyze top sources
      console.log('🌐 Step 2: Analyzing sources...');
      const topUrls = searchResults.results
        .filter(result => result.url && result.relevanceScore > 0.5)
        .slice(0, maxSources)
        .map(result => result.url);
      
      for (const url of topUrls) {
        try {
          const visitResult = await visitLinkTool.execute({
            url,
            extractionMode: 'summary',
            extractImages: includeImages,
            focusAreas,
            sessionId
          }, {
            messages: [],
            toolCallId: `visit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            abortSignal
          });
          
          // Enhanced visit tool is deprecated - use MCP browser tools instead
          if (visitResult.error) {
            console.warn('Enhanced visit tool deprecated:', visitResult.error);
            continue;
          }
          
          if (visitResult.content) {
            sources.push({
              url: visitResult.url,
              title: 'Unknown Title', // metadata no longer available
              content: visitResult.content,
              relevanceScore: 1.0, // default since relevanceScore no longer available
              images: [], // images no longer available
              extractedAt: visitResult.timestamp
            });
            
            // Generate insights from the content
            const contentInsights = extractInsights(visitResult.content, focusAreas);
            insights.push(...contentInsights);
          }
        } catch (error) {
          console.error(`Failed to visit ${url}:`, error);
        }
      }
      
      // Step 3: Generate summary insights
      const uniqueInsights = [...new Set(insights)];
      
      return {
        topic,
        focusAreas,
        sources,
        insights: uniqueInsights,
        totalSources: sources.length,
        totalImages: sources.reduce((acc, source) => acc + (source.images?.length || 0), 0),
        researchDuration: Date.now() - startTime,
        status: 'completed',
        timestamp: new Date().toISOString(),
        sessionId,
        type: 'deep_dive'
      };
      
    } catch (error) {
      console.error('Deep dive error:', error);
      return {
        topic,
        focusAreas,
        sources: [],
        insights: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        type: 'deep_dive'
      };
    }
  }
});

// Helper function to extract insights from content
function extractInsights(content: string, focusAreas: string[]): string[] {
  const insights: string[] = [];
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  for (const area of focusAreas) {
    const relevantSentences = sentences.filter(s => 
      s.toLowerCase().includes(area.toLowerCase())
    ).slice(0, 2);
    
    insights.push(...relevantSentences.map(s => s.trim()));
  }
  
  return insights.filter(Boolean);
}