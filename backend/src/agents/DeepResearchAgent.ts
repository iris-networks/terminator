import { tool } from 'ai';
import { z } from 'zod';
import axios from 'axios';
import puppeteer from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';

// Research state management
interface ResearchPlan {
  id: string;
  topic: string;
  objectives: string[];
  queries: string[];
  sources: string[];
  timeline: string;
  status: 'planning' | 'executing' | 'completed';
  createdAt: Date;
}

interface ResearchResult {
  id: string;
  planId: string;
  source: string;
  url: string;
  title: string;
  content: string;
  relevanceScore: number;
  extractedAt: Date;
  metadata: Record<string, any>;
}

// In-memory research state (in production, use a proper database)
const researchPlans = new Map<string, ResearchPlan>();
const researchResults = new Map<string, ResearchResult>();

// Advanced web search with multiple strategies
async function performAdvancedSearch(query: string, maxResults: number = 10): Promise<any[]> {
  const results: any[] = [];
  
  try {
    // Strategy 1: DuckDuckGo API
    const duckDuckGoUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const response = await axios.get(duckDuckGoUrl, {
      timeout: 10000,
      headers: { 'User-Agent': 'DeepResearchAgent/1.0' }
    });

    const data = response.data;
    
    if (data.Abstract) {
      results.push({
        title: data.Heading || 'Direct Answer',
        url: data.AbstractURL || 'https://duckduckgo.com',
        snippet: data.Abstract,
        source: 'duckduckgo_instant',
        relevanceScore: 0.9
      });
    }

    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
      for (const topic of data.RelatedTopics.slice(0, maxResults - results.length)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Result ? topic.Result.split(' - ')[0] : 'Related Topic',
            url: topic.FirstURL,
            snippet: topic.Text,
            source: 'duckduckgo_related',
            relevanceScore: 0.7
          });
        }
      }
    }

    // Strategy 2: Web scraping fallback if needed
    if (results.length < maxResults / 2) {
      const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      
      try {
        await page.goto(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });

        const webResults = await page.evaluate(() => {
          const results = [];
          const resultElements = document.querySelectorAll('.result');
          
          for (const element of Array.from(resultElements).slice(0, 8)) {
            const titleElement = element.querySelector('.result__title a');
            const snippetElement = element.querySelector('.result__snippet');
            
            if (titleElement && snippetElement) {
              results.push({
                title: titleElement.textContent?.trim() || '',
                url: titleElement.href || '',
                snippet: snippetElement.textContent?.trim() || '',
                source: 'duckduckgo_web',
                relevanceScore: 0.6
              });
            }
          }
          
          return results;
        });

        results.push(...webResults);
      } finally {
        await browser.close();
      }
    }

  } catch (error) {
    console.error('Advanced search error:', error);
  }

  return results.slice(0, maxResults);
}

// Deep content extraction from URLs
async function extractContentFromUrl(url: string): Promise<{
  title: string;
  content: string;
  metadata: Record<string, any>;
  success: boolean;
}> {
  try {
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });

    const extraction = await page.evaluate(() => {
      // Remove unwanted elements
      const unwantedSelectors = [
        'script', 'style', 'nav', 'header', 'footer', 
        '.advertisement', '.ads', '.sidebar', '.menu'
      ];
      
      unwantedSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => el.remove());
      });

      // Extract main content
      const contentSelectors = [
        'article', 'main', '.content', '.post-content', 
        '.entry-content', '.article-content', '[role="main"]'
      ];
      
      let mainContent = '';
      let title = document.title || '';
      
      // Try content selectors
      for (const selector of contentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          mainContent = element.textContent?.trim() || '';
          break;
        }
      }
      
      // Fallback to body if no specific content found
      if (!mainContent) {
        mainContent = document.body.textContent?.trim() || '';
      }
      
      // Extract metadata
      const metadata: Record<string, any> = {
        url: window.location.href,
        wordCount: mainContent.split(/\s+/).length,
        extractedAt: new Date().toISOString()
      };
      
      // Extract meta tags
      const metaTags = document.querySelectorAll('meta');
      metaTags.forEach(meta => {
        const name = meta.getAttribute('name') || meta.getAttribute('property');
        const content = meta.getAttribute('content');
        if (name && content) {
          metadata[name] = content;
        }
      });

      return {
        title,
        content: mainContent.substring(0, 10000), // Limit content size
        metadata
      };
    });

    await browser.close();
    
    return {
      ...extraction,
      success: true
    };

  } catch (error) {
    return {
      title: 'Extraction Failed',
      content: '',
      metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      success: false
    };
  }
}

// Create Research Plan Tool
export const createResearchPlanTool = tool({
  description: 'Create a comprehensive research plan for deep investigation of a topic',
  parameters: z.object({
    topic: z.string().describe('The main research topic'),
    objectives: z.array(z.string()).describe('Specific research objectives to achieve'),
    maxQueries: z.number().optional().default(10).describe('Maximum number of search queries to generate'),
    timeline: z.string().optional().default('immediate').describe('Research timeline (immediate, hours, days)')
  }),
  execute: async ({ topic, objectives, maxQueries, timeline }) => {
    console.log(`📋 Creating research plan for: ${topic}`);
    
    const planId = uuidv4();
    
    // Generate research queries based on topic and objectives
    const baseQueries = [
      topic,
      `${topic} definition explanation`,
      `${topic} current trends 2024`,
      `${topic} latest developments`,
      `${topic} research studies`,
      `${topic} expert opinions`,
      `${topic} case studies examples`,
      `${topic} future outlook predictions`
    ];
    
    // Add objective-specific queries
    const objectiveQueries = objectives.flatMap(obj => [
      `${topic} ${obj}`,
      `how to ${obj} ${topic}`,
      `${obj} in ${topic} field`
    ]);
    
    const allQueries = [...baseQueries, ...objectiveQueries].slice(0, maxQueries);
    
    const plan: ResearchPlan = {
      id: planId,
      topic,
      objectives,
      queries: allQueries,
      sources: [],
      timeline,
      status: 'planning',
      createdAt: new Date()
    };
    
    researchPlans.set(planId, plan);
    
    return {
      planId,
      topic,
      objectives,
      queries: allQueries,
      estimatedTime: `${allQueries.length * 2} minutes`,
      status: 'created',
      nextStep: 'Execute the research plan using execute_research_plan'
    };
  },
});

// Execute Research Plan Tool
export const executeResearchPlanTool = tool({
  description: 'Execute a research plan by performing searches and content extraction',
  parameters: z.object({
    planId: z.string().describe('Research plan ID to execute'),
    maxSourcesPerQuery: z.number().optional().default(5).describe('Maximum sources to investigate per query'),
    deepExtraction: z.boolean().optional().default(true).describe('Perform deep content extraction from sources')
  }),
  execute: async ({ planId, maxSourcesPerQuery, deepExtraction }) => {
    console.log(`🔍 Executing research plan: ${planId}`);
    
    const plan = researchPlans.get(planId);
    if (!plan) {
      return {
        success: false,
        error: 'Research plan not found',
        planId
      };
    }
    
    plan.status = 'executing';
    researchPlans.set(planId, plan);
    
    const allResults: ResearchResult[] = [];
    let totalSources = 0;
    
    try {
      // Execute each query in the plan
      for (const query of plan.queries) {
        console.log(`🔍 Searching: ${query}`);
        
        const searchResults = await performAdvancedSearch(query, maxSourcesPerQuery);
        
        for (const result of searchResults) {
          totalSources++;
          
          let content = result.snippet;
          let metadata = { 
            query, 
            source: result.source,
            relevanceScore: result.relevanceScore 
          };
          
          // Perform deep extraction if enabled and URL is available
          if (deepExtraction && result.url && result.url.startsWith('http')) {
            try {
              const extraction = await extractContentFromUrl(result.url);
              if (extraction.success) {
                content = extraction.content;
                metadata = { ...metadata, ...extraction.metadata };
              }
            } catch (error) {
              console.log(`Failed to extract from ${result.url}: ${error}`);
            }
          }
          
          const researchResult: ResearchResult = {
            id: uuidv4(),
            planId,
            source: result.source,
            url: result.url,
            title: result.title,
            content,
            relevanceScore: result.relevanceScore,
            extractedAt: new Date(),
            metadata
          };
          
          allResults.push(researchResult);
          researchResults.set(researchResult.id, researchResult);
        }
      }
      
      // Update plan status
      plan.status = 'completed';
      plan.sources = allResults.map(r => r.url);
      researchPlans.set(planId, plan);
      
      return {
        planId,
        success: true,
        totalQueries: plan.queries.length,
        totalSources,
        totalResults: allResults.length,
        results: allResults.map(r => ({
          id: r.id,
          title: r.title,
          url: r.url,
          relevanceScore: r.relevanceScore,
          contentLength: r.content.length,
          source: r.source
        })),
        nextStep: 'Generate research report using generate_research_report'
      };
      
    } catch (error) {
      plan.status = 'completed';
      researchPlans.set(planId, plan);
      
      return {
        planId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        partialResults: allResults.length
      };
    }
  },
});

// Generate Research Report Tool
export const generateResearchReportTool = tool({
  description: 'Generate a comprehensive research report from collected data',
  parameters: z.object({
    planId: z.string().describe('Research plan ID to generate report for'),
    format: z.enum(['markdown', 'json', 'summary']).optional().default('markdown').describe('Report format'),
    includeSourcesList: z.boolean().optional().default(true).describe('Include sources list in report'),
    maxContentLength: z.number().optional().default(50000).describe('Maximum content length for report')
  }),
  execute: async ({ planId, format, includeSourcesList, maxContentLength }) => {
    console.log(`📊 Generating research report for plan: ${planId}`);
    
    const plan = researchPlans.get(planId);
    if (!plan) {
      return {
        success: false,
        error: 'Research plan not found',
        planId
      };
    }
    
    // Get all results for this plan
    const planResults = Array.from(researchResults.values())
      .filter(result => result.planId === planId)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    if (planResults.length === 0) {
      return {
        success: false,
        error: 'No research results found for this plan',
        planId
      };
    }
    
    const reportId = uuidv4();
    
    if (format === 'summary') {
      const summary = {
        reportId,
        planId,
        topic: plan.topic,
        objectives: plan.objectives,
        totalSources: planResults.length,
        highRelevanceSources: planResults.filter(r => r.relevanceScore > 0.7).length,
        keyFindings: planResults.slice(0, 5).map(r => ({
          title: r.title,
          source: r.url,
          relevanceScore: r.relevanceScore
        })),
        generatedAt: new Date().toISOString()
      };
      
      return {
        success: true,
        reportId,
        format: 'summary',
        report: summary
      };
    }
    
    if (format === 'json') {
      const jsonReport = {
        reportId,
        planId,
        metadata: {
          topic: plan.topic,
          objectives: plan.objectives,
          generatedAt: new Date().toISOString(),
          totalSources: planResults.length
        },
        results: planResults.map(r => ({
          id: r.id,
          title: r.title,
          url: r.url,
          content: r.content.substring(0, 2000),
          relevanceScore: r.relevanceScore,
          metadata: r.metadata
        }))
      };
      
      return {
        success: true,
        reportId,
        format: 'json',
        report: jsonReport
      };
    }
    
    // Generate Markdown report
    let markdownReport = `# Research Report: ${plan.topic}\n\n`;
    markdownReport += `**Generated on:** ${new Date().toISOString()}\n`;
    markdownReport += `**Research Plan:** ${planId}\n`;
    markdownReport += `**Total Sources:** ${planResults.length}\n\n`;
    
    // Executive Summary
    markdownReport += `## Executive Summary\n\n`;
    markdownReport += `This research investigated ${plan.topic} with the following objectives:\n\n`;
    plan.objectives.forEach((obj, i) => {
      markdownReport += `${i + 1}. ${obj}\n`;
    });
    markdownReport += `\n`;
    
    // Key Findings
    markdownReport += `## Key Findings\n\n`;
    const topResults = planResults.slice(0, 10);
    
    topResults.forEach((result, i) => {
      markdownReport += `### ${i + 1}. ${result.title}\n\n`;
      markdownReport += `**Source:** [${result.url}](${result.url})\n`;
      markdownReport += `**Relevance Score:** ${result.relevanceScore.toFixed(2)}\n\n`;
      
      const content = result.content.substring(0, 1000);
      markdownReport += `${content}${content.length >= 1000 ? '...' : ''}\n\n`;
      markdownReport += `---\n\n`;
    });
    
    // Sources
    if (includeSourcesList) {
      markdownReport += `## Sources\n\n`;
      planResults.forEach((result, i) => {
        markdownReport += `${i + 1}. [${result.title}](${result.url}) (Score: ${result.relevanceScore.toFixed(2)})\n`;
      });
    }
    
    // Limit report length
    if (markdownReport.length > maxContentLength) {
      markdownReport = markdownReport.substring(0, maxContentLength) + '\n\n... (Report truncated due to length limits)';
    }
    
    return {
      success: true,
      reportId,
      planId,
      format: 'markdown',
      report: markdownReport,
      metadata: {
        topic: plan.topic,
        totalSources: planResults.length,
        reportLength: markdownReport.length,
        generatedAt: new Date().toISOString()
      }
    };
  },
});

// List Research Plans Tool
export const listResearchPlansTool = tool({
  description: 'List all research plans with their status',
  parameters: z.object({
    status: z.enum(['planning', 'executing', 'completed', 'all']).optional().default('all').describe('Filter by status')
  }),
  execute: async ({ status }) => {
    const plans = Array.from(researchPlans.values());
    
    const filteredPlans = status === 'all' 
      ? plans 
      : plans.filter(plan => plan.status === status);
    
    return {
      totalPlans: plans.length,
      filteredPlans: filteredPlans.length,
      plans: filteredPlans.map(plan => ({
        id: plan.id,
        topic: plan.topic,
        status: plan.status,
        objectives: plan.objectives.length,
        queries: plan.queries.length,
        sources: plan.sources.length,
        createdAt: plan.createdAt.toISOString()
      }))
    };
  },
});

// Export Deep Research tools
export const deepResearchTools = {
  create_research_plan: createResearchPlanTool,
  execute_research_plan: executeResearchPlanTool,
  generate_research_report: generateResearchReportTool,
  list_research_plans: listResearchPlansTool,
};