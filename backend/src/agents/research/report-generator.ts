import { tool } from 'ai';
import { z } from 'zod';
import { researchSessions } from './types.js';

export const reportGeneratorTool = tool({
  description: 'Generate comprehensive research reports from collected data',
  parameters: z.object({
    sessionId: z.string().describe('Research session ID'),
    format: z.enum(['markdown', 'html', 'json']).optional().default('markdown').describe('Report format'),
    includeImages: z.boolean().optional().default(false).describe('Include images in the report'),
    sections: z.array(z.string()).optional().describe('Specific sections to include')
  }),
  execute: async ({ sessionId, format, includeImages, sections }) => {
    console.log(`📄 Generating report for session ${sessionId} in ${format} format`);
    
    try {
      const session = researchSessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }
      
      const { plan, topic, contentCollections, collectedImages, visitedUrls } = session;
      
      let report = '';
      const metadata = {
        title: plan.title,
        topic: topic.mainTopic,
        subtopics: topic.subtopics,
        generatedAt: new Date().toISOString(),
        totalSources: visitedUrls.size,
        totalImages: collectedImages.length,
        researchStatus: plan.status
      };
      
      // Generate report based on format
      switch (format) {
        case 'markdown':
          report = generateMarkdownReport(metadata, plan, contentCollections, collectedImages, includeImages, sections);
          break;
          
        case 'html':
          report = generateHTMLReport(metadata, plan, contentCollections, collectedImages, includeImages, sections);
          break;
          
        case 'json':
          report = JSON.stringify({
            metadata,
            plan,
            contentCollections: Array.from(contentCollections.entries()),
            collectedImages: includeImages ? collectedImages : [],
            visitedUrls: Array.from(visitedUrls)
          }, null, 2);
          break;
      }
      
      return {
        sessionId,
        format,
        report,
        metadata,
        reportLength: report.length,
        timestamp: new Date().toISOString(),
        type: 'research_report'
      };
      
    } catch (error) {
      console.error('Report generation error:', error);
      return {
        sessionId,
        format,
        report: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        type: 'research_report'
      };
    }
  }
});

function generateMarkdownReport(metadata: any, plan: any, contentCollections: Map<string, any>, collectedImages: any[], includeImages: boolean, sections?: string[]): string {
  let report = `# ${metadata.title}\n\n`;
  report += `**Generated:** ${metadata.generatedAt}\n`;
  report += `**Status:** ${metadata.researchStatus}\n`;
  report += `**Sources:** ${metadata.totalSources}\n\n`;
  
  report += `## Research Overview\n\n`;
  report += `**Main Topic:** ${metadata.topic}\n`;
  report += `**Subtopics:** ${metadata.subtopics.join(', ')}\n\n`;
  
  // Add plan progress
  report += `## Research Progress\n\n`;
  for (const step of plan.steps) {
    report += `- [${step.status === 'completed' ? 'x' : ' '}] ${step.title}: ${step.description}\n`;
  }
  report += '\n';
  
  // Add content collections
  if (contentCollections.size > 0) {
    report += `## Findings\n\n`;
    for (const [topic, collection] of contentCollections) {
      report += `### ${topic}\n\n`;
      collection.content.forEach((content: string) => {
        report += `${content.substring(0, 200)}...\n\n`;
      });
    }
  }
  
  // Add images if requested
  if (includeImages && collectedImages.length > 0) {
    report += `## Images\n\n`;
    collectedImages.slice(0, 10).forEach((img, index) => {
      report += `![Image ${index + 1}](${img.src})\n`;
      if (img.alt) report += `*${img.alt}*\n\n`;
    });
  }
  
  return report;
}

function generateHTMLReport(metadata: any, plan: any, contentCollections: Map<string, any>, collectedImages: any[], includeImages: boolean, sections?: string[]): string {
  let html = `<!DOCTYPE html><html><head><title>${metadata.title}</title></head><body>`;
  html += `<h1>${metadata.title}</h1>`;
  html += `<p><strong>Generated:</strong> ${metadata.generatedAt}</p>`;
  html += `<p><strong>Status:</strong> ${metadata.researchStatus}</p>`;
  html += `<p><strong>Sources:</strong> ${metadata.totalSources}</p>`;
  
  html += `<h2>Research Progress</h2><ul>`;
  for (const step of plan.steps) {
    html += `<li>${step.status === 'completed' ? '✓' : '○'} ${step.title}: ${step.description}</li>`;
  }
  html += '</ul>';
  
  if (contentCollections.size > 0) {
    html += `<h2>Findings</h2>`;
    for (const [topic, collection] of contentCollections) {
      html += `<h3>${topic}</h3>`;
      collection.content.forEach((content: string) => {
        html += `<p>${content.substring(0, 200)}...</p>`;
      });
    }
  }
  
  if (includeImages && collectedImages.length > 0) {
    html += `<h2>Images</h2>`;
    collectedImages.slice(0, 10).forEach((img, index) => {
      html += `<img src="${img.src}" alt="${img.alt}" style="max-width: 300px;"><br>`;
      if (img.alt) html += `<em>${img.alt}</em><br><br>`;
    });
  }
  
  html += '</body></html>';
  return html;
}