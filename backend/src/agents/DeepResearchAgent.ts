import { tool } from 'ai';
import { z } from 'zod';
import axios from 'axios';
import { BrowserManager } from '../services/BrowserManager.js';

// Research topic structure
interface ResearchTopic {
  mainTopic: string;
  subtopics: string[];
  keywords: string[];
  language: 'en' | 'zh' | 'auto';
}

// Plan step structure
interface PlanStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
  results?: any[];
}

// Research plan structure
interface ResearchPlan {
  id: string;
  title: string;
  steps: PlanStep[];
  totalSteps: number;
  completedSteps: number;
  status: 'planning' | 'in_progress' | 'completed';
  timestamp: string;
}

// Content collection
interface ContentCollection {
  topic: string;
  urls: string[];
  content: string[];
  images: string[];
  relevanceScore: number;
}

// Global state for research sessions
const researchSessions = new Map<string, {
  plan: ResearchPlan;
  topic: ResearchTopic;
  contentCollections: Map<string, ContentCollection>;
  visitedUrls: Set<string>;
  collectedImages: any[];
}>();

// Enhanced Search Tool
export const enhancedSearchTool = tool({
  description: 'Perform enhanced web search with domain filtering and query optimization for research',
  parameters: z.object({
    query: z.string().describe('The search query'),
    maxResults: z.number().optional().default(10).describe('Maximum number of results'),
    domains: z.array(z.string()).optional().describe('Specific domains to search within'),
    excludeDomains: z.array(z.string()).optional().describe('Domains to exclude from search'),
    searchEngine: z.enum(['duckduckgo', 'google', 'bing']).optional().default('duckduckgo').describe('Search engine to use'),
    sessionId: z.string().optional().describe('Research session ID for tracking')
  }),
  execute: async ({ query, maxResults, domains, excludeDomains, searchEngine, sessionId }) => {
    console.log(`🔍 Enhanced Search: "${query}" using ${searchEngine}`);
    
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
        }
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

// Enhanced Visit Link Tool
export const enhancedVisitLinkTool = tool({
  description: 'Visit and extract detailed content from web pages with enhanced analysis',
  parameters: z.object({
    url: z.string().describe('URL to visit and extract content from'),
    extractionMode: z.enum(['full', 'summary', 'structured']).optional().default('full').describe('Content extraction mode'),
    extractImages: z.boolean().optional().default(false).describe('Extract images from the page'),
    focusAreas: z.array(z.string()).optional().describe('Specific topics or areas to focus on'),
    sessionId: z.string().optional().describe('Research session ID for tracking')
  }),
  execute: async ({ url, extractionMode, extractImages, focusAreas, sessionId }) => {
    console.log(`🌐 Enhanced Visit: ${url} (mode: ${extractionMode})`);
    
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
      
      // Navigate to the URL
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
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
            
            return [...headings, ...paragraphs].join('\\n\\n');
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

// Deep Dive Tool
export const deepDiveTool = tool({
  description: 'Perform comprehensive research on a specific topic using multiple sources',
  parameters: z.object({
    topic: z.string().describe('The topic to research in-depth'),
    focusAreas: z.array(z.string()).describe('Specific areas to focus the research on'),
    maxSources: z.number().optional().default(5).describe('Maximum number of sources to analyze'),
    includeImages: z.boolean().optional().default(false).describe('Include relevant images in the research'),
    sessionId: z.string().describe('Research session ID')
  }),
  execute: async ({ topic, focusAreas, maxSources, includeImages, sessionId }) => {
    console.log(`🔬 Deep Dive: Researching "${topic}"`);
    
    try {
      const startTime = Date.now();
      const sources: any[] = [];
      const insights: string[] = [];
      
      // Step 1: Enhanced search for the topic
      console.log('📊 Step 1: Searching for sources...');
      const searchQuery = `${topic} ${focusAreas.join(' ')}`;
      
      // Use the enhanced search tool
      const searchResults = await enhancedSearchTool.execute({
        query: searchQuery,
        maxResults: maxSources * 2, // Get more results to filter from
        sessionId
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
          const visitResult = await enhancedVisitLinkTool.execute({
            url,
            extractionMode: 'full',
            extractImages: includeImages,
            focusAreas,
            sessionId
          });
          
          if (visitResult.content && visitResult.relevanceScore > 0.3) {
            sources.push({
              url: visitResult.url,
              title: visitResult.metadata?.title || 'Untitled',
              content: visitResult.content.substring(0, 2000), // Limit content length
              relevanceScore: visitResult.relevanceScore,
              images: visitResult.images || [],
              extractedAt: visitResult.timestamp
            });
            
            // Generate insights based on focus areas
            focusAreas.forEach(area => {
              if (visitResult.content.toLowerCase().includes(area.toLowerCase())) {
                const sentences = visitResult.content.split('.').filter(s => 
                  s.toLowerCase().includes(area.toLowerCase()) && s.length > 20
                );
                if (sentences.length > 0) {
                  insights.push(`${area}: ${sentences[0].trim()}.`);
                }
              }
            });
          }
        } catch (error) {
          console.error(`Failed to visit ${url}:`, error);
        }
      }
      
      // Step 3: Analyze and synthesize findings
      console.log('🧠 Step 3: Synthesizing insights...');
      
      // Generate summary insights
      const topSources = sources.sort((a, b) => b.relevanceScore - a.relevanceScore);
      const coverageAnalysis = focusAreas.map(area => ({
        area,
        coverage: sources.filter(s => s.content.toLowerCase().includes(area.toLowerCase())).length,
        relevantSources: sources.filter(s => s.content.toLowerCase().includes(area.toLowerCase())).length
      }));
      
      const duration = Date.now() - startTime;
      
      return {
        topic,
        focusAreas,
        sources: topSources,
        insights: [...insights, `Research completed in ${Math.round(duration / 1000)}s with ${sources.length} relevant sources`],
        coverageAnalysis,
        totalSources: sources.length,
        relevantSources: sources.filter(s => s.relevanceScore > 0.5).length,
        avgRelevanceScore: sources.reduce((sum, s) => sum + s.relevanceScore, 0) / sources.length,
        duration,
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
        status: 'error',
        timestamp: new Date().toISOString(),
        sessionId,
        type: 'deep_dive'
      };
    }
  }
});

// Research Plan Tool
export const researchPlanTool = tool({
  description: 'Create and manage research plans for deep research tasks',
  parameters: z.object({
    action: z.enum(['create', 'update', 'get', 'complete_step']).describe('Action to perform'),
    sessionId: z.string().describe('Research session ID'),
    query: z.string().optional().describe('Research query (required for create)'),
    stepId: z.string().optional().describe('Step ID (required for complete_step)'),
    results: z.any().optional().describe('Step results (for complete_step)')
  }),
  execute: async ({ action, sessionId, query, stepId, results }) => {
    console.log(`📋 Research Plan: ${action} for session ${sessionId}`);
    
    try {
      switch (action) {
        case 'create':
          if (!query) throw new Error('Query required for create action');
          
          // Analyze research topic
          const topic: ResearchTopic = {
            mainTopic: query,
            subtopics: query.split(' ').filter(word => word.length > 3), // Simple extraction
            keywords: query.toLowerCase().split(' ').filter(word => word.length > 2),
            language: /[\\u4e00-\\u9fff]/.test(query) ? 'zh' : 'en'
          };
          
          // Generate research plan steps
          const steps: PlanStep[] = [
            {
              id: 'step_1',
              title: 'Initial Research',
              description: `Search for general information about ${topic.mainTopic}`,
              status: 'pending',
              progress: 0
            },
            {
              id: 'step_2', 
              title: 'Deep Analysis',
              description: `Analyze specific aspects: ${topic.subtopics.join(', ')}`,
              status: 'pending',
              progress: 0
            },
            {
              id: 'step_3',
              title: 'Expert Sources',
              description: 'Find authoritative sources and expert opinions',
              status: 'pending',
              progress: 0
            },
            {
              id: 'step_4',
              title: 'Current Developments',
              description: 'Research recent developments and trends',
              status: 'pending',
              progress: 0
            },
            {
              id: 'step_5',
              title: 'Synthesis',
              description: 'Synthesize findings and prepare comprehensive report',
              status: 'pending',
              progress: 0
            }
          ];
          
          const plan: ResearchPlan = {
            id: `plan_${sessionId}`,
            title: `Research: ${topic.mainTopic}`,
            steps,
            totalSteps: steps.length,
            completedSteps: 0,
            status: 'in_progress',
            timestamp: new Date().toISOString()
          };
          
          // Store session
          researchSessions.set(sessionId, {
            plan,
            topic,
            contentCollections: new Map(),
            visitedUrls: new Set(),
            collectedImages: []
          });
          
          return {
            action: 'create',
            sessionId,
            plan,
            topic,
            timestamp: new Date().toISOString(),
            type: 'research_plan'
          };
          
        case 'update':
          const session = researchSessions.get(sessionId);
          if (!session) throw new Error('Session not found');
          
          return {
            action: 'update',
            sessionId,
            plan: session.plan,
            topic: session.topic,
            timestamp: new Date().toISOString(),
            type: 'research_plan'
          };
          
        case 'get':
          const getSession = researchSessions.get(sessionId);
          if (!getSession) throw new Error('Session not found');
          
          return {
            action: 'get',
            sessionId,
            plan: getSession.plan,
            topic: getSession.topic,
            visitedUrls: Array.from(getSession.visitedUrls),
            collectedImages: getSession.collectedImages,
            timestamp: new Date().toISOString(),
            type: 'research_plan'
          };
          
        case 'complete_step':
          if (!stepId) throw new Error('Step ID required for complete_step');
          
          const completeSession = researchSessions.get(sessionId);
          if (!completeSession) throw new Error('Session not found');
          
          const step = completeSession.plan.steps.find(s => s.id === stepId);
          if (!step) throw new Error('Step not found');
          
          step.status = 'completed';
          step.progress = 100;
          step.results = results;
          
          completeSession.plan.completedSteps += 1;
          
          if (completeSession.plan.completedSteps >= completeSession.plan.totalSteps) {
            completeSession.plan.status = 'completed';
          }
          
          return {
            action: 'complete_step',
            sessionId,
            stepId,
            step,
            plan: completeSession.plan,
            allCompleted: completeSession.plan.status === 'completed',
            timestamp: new Date().toISOString(),
            type: 'research_plan'
          };
          
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      
    } catch (error) {
      console.error('Research plan error:', error);
      return {
        action,
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        type: 'research_plan'
      };
    }
  }
});

// Report Generator Tool
export const reportGeneratorTool = tool({
  description: 'Generate comprehensive research reports from collected data',
  parameters: z.object({
    sessionId: z.string().describe('Research session ID'),
    reportTitle: z.string().optional().describe('Custom report title'),
    includeSources: z.boolean().optional().default(true).describe('Include source attribution'),
    includeImages: z.boolean().optional().default(false).describe('Include collected images'),
    format: z.enum(['markdown', 'html', 'text']).optional().default('markdown').describe('Report format')
  }),
  execute: async ({ sessionId, reportTitle, includeSources, includeImages, format }) => {
    console.log(`📄 Generating ${format} report for session ${sessionId}`);
    
    try {
      const session = researchSessions.get(sessionId);
      if (!session) throw new Error('Research session not found');
      
      const { plan, topic, contentCollections, visitedUrls, collectedImages } = session;
      
      // Generate report structure
      const title = reportTitle || `Research Report: ${topic.mainTopic}`;
      let report = '';
      
      if (format === 'markdown') {
        report += `# ${title}\\n\\n`;
        report += `**Research Topic:** ${topic.mainTopic}\\n`;
        report += `**Subtopics:** ${topic.subtopics.join(', ')}\\n`;
        report += `**Keywords:** ${topic.keywords.join(', ')}\\n`;
        report += `**Generated:** ${new Date().toLocaleString()}\\n\\n`;
        
        // Add executive summary
        report += `## Executive Summary\\n\\n`;
        report += `This report presents comprehensive research findings on ${topic.mainTopic}. `;
        report += `The research covered ${plan.totalSteps} main areas and analyzed ${visitedUrls.size} sources.\\n\\n`;
        
        // Add main findings
        report += `## Main Findings\\n\\n`;
        plan.steps.forEach((step, index) => {
          if (step.status === 'completed' && step.results) {
            report += `### ${index + 1}. ${step.title}\\n\\n`;
            report += `${step.description}\\n\\n`;
            
            if (step.results.insights) {
              step.results.insights.forEach((insight: string) => {
                report += `- ${insight}\\n`;
              });
              report += '\\n';
            }
          }
        });
        
        // Add collected insights from content
        if (contentCollections.size > 0) {
          report += `## Detailed Analysis\\n\\n`;
          contentCollections.forEach((collection, topicKey) => {
            report += `### ${topicKey}\\n\\n`;
            collection.content.forEach(content => {
              report += `${content.substring(0, 300)}...\\n\\n`;
            });
          });
        }
        
        // Add images if requested
        if (includeImages && collectedImages.length > 0) {
          report += `## Visual Content\\n\\n`;
          collectedImages.slice(0, 10).forEach((image, index) => {
            if (image.alt) {
              report += `![${image.alt}](${image.src})\\n`;
              report += `*Source: ${image.sourceUrl}*\\n\\n`;
            }
          });
        }
        
        // Add sources
        if (includeSources && visitedUrls.size > 0) {
          report += `## Sources\\n\\n`;
          Array.from(visitedUrls).forEach((url, index) => {
            report += `${index + 1}. [${url}](${url})\\n`;
          });
          report += '\\n';
        }
        
        // Add conclusion
        report += `## Conclusion\\n\\n`;
        report += `This research on ${topic.mainTopic} covered ${visitedUrls.size} sources across ${plan.completedSteps} research phases. `;
        report += `The findings provide comprehensive insights into the key aspects of ${topic.mainTopic}.\\n`;
        
      } else if (format === 'html') {
        // HTML format implementation
        report = `
          <html>
          <head><title>${title}</title></head>
          <body>
            <h1>${title}</h1>
            <p><strong>Research Topic:</strong> ${topic.mainTopic}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <!-- HTML content would be generated here -->
          </body>
          </html>
        `;
      } else {
        // Plain text format
        report = `${title}\\n${'='.repeat(title.length)}\\n\\n`;
        report += `Research Topic: ${topic.mainTopic}\\n`;
        report += `Generated: ${new Date().toLocaleString()}\\n\\n`;
        // Text content would be generated here
      }
      
      return {
        sessionId,
        title,
        report,
        format,
        wordCount: report.split(' ').length,
        sourceCount: visitedUrls.size,
        imageCount: collectedImages.length,
        completedSteps: plan.completedSteps,
        totalSteps: plan.totalSteps,
        timestamp: new Date().toISOString(),
        type: 'research_report',
        isDeepResearch: true
      };
      
    } catch (error) {
      console.error('Report generation error:', error);
      return {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        type: 'research_report'
      };
    }
  }
});

// Export all DeepResearch tools
export const deepResearchTools = {
  enhanced_search: enhancedSearchTool,
  enhanced_visit_link: enhancedVisitLinkTool,
  deep_dive: deepDiveTool,
  research_plan: researchPlanTool,
  report_generator: reportGeneratorTool
};