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
import { researchSessions, deleteSession } from './types.js';

export const sessionManagerTool = tool({
  description: 'Manage research sessions - list, get info, or delete sessions',
  parameters: z.object({
    action: z.enum(['list', 'info', 'delete']).describe('Action to perform'),
    sessionId: z.string().optional().describe('Session ID (required for info/delete actions)')
  }),
  execute: async ({ action, sessionId }) => {
    console.log(`🗂️  Session Manager: ${action}${sessionId ? ` for ${sessionId}` : ''}`);
    
    try {
      switch (action) {
        case 'list':
          const sessions = Array.from(researchSessions.entries()).map(([id, session]) => ({
            id,
            title: session.plan.title,
            status: session.plan.status,
            completedSteps: session.plan.completedSteps,
            totalSteps: session.plan.totalSteps,
            topic: session.topic.mainTopic,
            visitedUrls: session.visitedUrls.size,
            collectedImages: session.collectedImages.length,
            lastModified: session.plan.timestamp
          }));
          
          return {
            action: 'list',
            sessions,
            totalSessions: sessions.length,
            timestamp: new Date().toISOString(),
            type: 'session_manager'
          };
          
        case 'info':
          if (!sessionId) {
            throw new Error('Session ID required for info action');
          }
          
          const session = researchSessions.get(sessionId);
          if (!session) {
            throw new Error(`Session ${sessionId} not found`);
          }
          
          return {
            action: 'info',
            sessionId,
            session: {
              plan: session.plan,
              topic: session.topic,
              visitedUrls: Array.from(session.visitedUrls),
              contentCollections: Array.from(session.contentCollections.keys()),
              collectedImages: session.collectedImages.length,
              stats: {
                totalUrls: session.visitedUrls.size,
                totalImages: session.collectedImages.length,
                totalCollections: session.contentCollections.size
              }
            },
            timestamp: new Date().toISOString(),
            type: 'session_manager'
          };
          
        case 'delete':
          if (!sessionId) {
            throw new Error('Session ID required for delete action');
          }
          
          if (!researchSessions.has(sessionId)) {
            throw new Error(`Session ${sessionId} not found`);
          }
          
          deleteSession(sessionId);
          
          return {
            action: 'delete',
            sessionId,
            status: 'deleted',
            timestamp: new Date().toISOString(),
            type: 'session_manager'
          };
          
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      
    } catch (error) {
      console.error('Session manager error:', error);
      return {
        action,
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        type: 'session_manager'
      };
    }
  }
});