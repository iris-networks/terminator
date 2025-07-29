export type { ResearchTopic, ResearchPlan, PlanStep, ContentCollection } from './research/types.js';
export { researchSessions } from './research/types.js';
export { enhancedSearchTool } from './research/enhanced-search.js';
export { enhancedVisitLinkTool } from './research/enhanced-visit.js';
export { deepDiveTool } from './research/deep-dive.js';
export { researchPlanTool } from './research/research-plan.js';  
export { reportGeneratorTool } from './research/report-generator.js';

import { enhancedSearchTool } from './research/enhanced-search.js';
import { enhancedVisitLinkTool } from './research/enhanced-visit.js';
import { deepDiveTool } from './research/deep-dive.js';
import { researchPlanTool } from './research/research-plan.js';
import { reportGeneratorTool } from './research/report-generator.js';

// Export tools collection
export const deepResearchTools = {
  enhanced_search: enhancedSearchTool,
  enhanced_visit_link: enhancedVisitLinkTool,
  deep_dive: deepDiveTool,
  research_plan: researchPlanTool,
  report_generator: reportGeneratorTool,
};