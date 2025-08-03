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
import { ResearchTopic, ResearchPlan, PlanStep, researchSessions, saveSession, ContentCollection } from './types.js';

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
            subtopics: query.split(' ').filter(word => word.length > 3),
            keywords: query.toLowerCase().split(' ').filter(word => word.length > 2),
            language: /[\u4e00-\u9fff]/.test(query) ? 'zh' : 'en'
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
              title: 'Synthesis',
              description: 'Synthesize findings and generate comprehensive report',
              status: 'pending',
              progress: 0
            }
          ];
          
          const plan: ResearchPlan = {
            id: sessionId,
            title: `Research: ${topic.mainTopic}`,
            steps,
            totalSteps: steps.length,
            completedSteps: 0,
            status: 'planning',
            timestamp: new Date().toISOString()
          };
          
          // Create session
          const newSession = {
            plan,
            topic,
            contentCollections: new Map<string, ContentCollection>(),
            visitedUrls: new Set<string>(),
            collectedImages: []
          };
          researchSessions.set(sessionId, newSession);
          saveSession(sessionId, newSession);
          
          return {
            action: 'create',
            sessionId,
            plan,
            topic,
            status: 'success',
            timestamp: new Date().toISOString(),
            type: 'research_plan'
          };
          
        case 'get':
          const session = researchSessions.get(sessionId);
          if (!session) {
            throw new Error(`Session ${sessionId} not found`);
          }
          
          return {
            action: 'get',
            sessionId,
            plan: session.plan,
            topic: session.topic,
            status: 'success',
            timestamp: new Date().toISOString(),
            type: 'research_plan'
          };
          
        case 'complete_step':
          if (!stepId) throw new Error('Step ID required for complete_step action');
          
          const currentSession = researchSessions.get(sessionId);
          if (!currentSession) {
            throw new Error(`Session ${sessionId} not found`);
          }
          
          const step = currentSession.plan.steps.find(s => s.id === stepId);
          if (!step) {
            throw new Error(`Step ${stepId} not found`);
          }
          
          step.status = 'completed';
          step.progress = 100;
          step.results = results;
          
          currentSession.plan.completedSteps++;
          
          if (currentSession.plan.completedSteps === currentSession.plan.totalSteps) {
            currentSession.plan.status = 'completed';
          } else {
            currentSession.plan.status = 'in_progress';
          }
          
          // Save updated session
          saveSession(sessionId, currentSession);
          
          return {
            action: 'complete_step',
            sessionId,
            stepId,
            plan: currentSession.plan,
            status: 'success',
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
        status: 'error',
        timestamp: new Date().toISOString(),
        type: 'research_plan'
      };
    }
  }
});