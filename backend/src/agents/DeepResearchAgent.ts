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
export type { ResearchTopic, ResearchPlan, PlanStep, ContentCollection } from './research/types.js';
export { researchSessions } from './research/types.js';
export { searchTool } from './research/enhanced-search.js';
export { visitLinkTool } from './research/enhanced-visit.js';
export { deepDiveTool } from './research/deep-dive.js';
export { researchPlanTool } from './research/research-plan.js';  
export { reportGeneratorTool } from './research/report-generator.js';
export { sessionManagerTool } from './research/session-manager.js';

import { searchTool } from './research/enhanced-search.js';
import { visitLinkTool } from './research/enhanced-visit.js';
import { deepDiveTool } from './research/deep-dive.js';
import { researchPlanTool } from './research/research-plan.js';
import { reportGeneratorTool } from './research/report-generator.js';
import { sessionManagerTool } from './research/session-manager.js';

// Export tools collection
export const deepResearchTools = {
  search: searchTool,
  visit_link: visitLinkTool,
  deep_dive: deepDiveTool,
  research_plan: researchPlanTool,
  report_generator: reportGeneratorTool,
  session_manager: sessionManagerTool,
};