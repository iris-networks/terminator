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
// Research topic structure
export interface ResearchTopic {
  mainTopic: string;
  subtopics: string[];
  keywords: string[];
  language: 'en' | 'zh' | 'auto';
}

// Plan step structure
export interface PlanStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
  results?: any[];
}

// Research plan structure
export interface ResearchPlan {
  id: string;
  title: string;
  steps: PlanStep[];
  totalSteps: number;
  completedSteps: number;
  status: 'planning' | 'in_progress' | 'completed';
  timestamp: string;
}

// Content collection
export interface ContentCollection {
  topic: string;
  urls: string[];
  content: string[];
  images: string[];
  relevanceScore: number;
}

// Research session state
export interface ResearchSession {
  plan: ResearchPlan;
  topic: ResearchTopic;
  contentCollections: Map<string, ContentCollection>;
  visitedUrls: Set<string>;
  collectedImages: any[];
}

import * as fs from 'fs';
import * as path from 'path';

// Global state for research sessions
export const researchSessions = new Map<string, ResearchSession>();

// Sessions storage file path
const SESSIONS_FILE = path.join(process.cwd(), 'data', 'research-sessions.json');

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.dirname(SESSIONS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Serialize session for storage (handle Map and Set)
const serializeSession = (session: ResearchSession): any => {
  return {
    plan: session.plan,
    topic: session.topic,
    contentCollections: Array.from(session.contentCollections.entries()),
    visitedUrls: Array.from(session.visitedUrls),
    collectedImages: session.collectedImages
  };
};

// Deserialize session from storage (restore Map and Set)
const deserializeSession = (data: any): ResearchSession => {
  return {
    plan: data.plan,
    topic: data.topic,
    contentCollections: new Map(data.contentCollections || []),
    visitedUrls: new Set(data.visitedUrls || []),
    collectedImages: data.collectedImages || []
  };
};

// Save sessions to file
export const saveSession = (sessionId: string, session: ResearchSession): void => {
  try {
    ensureDataDir();
    
    // Load existing sessions
    let existingSessions: Record<string, any> = {};
    if (fs.existsSync(SESSIONS_FILE)) {
      const fileContent = fs.readFileSync(SESSIONS_FILE, 'utf-8');
      existingSessions = JSON.parse(fileContent);
    }
    
    // Add/update the session
    existingSessions[sessionId] = serializeSession(session);
    
    // Save back to file
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(existingSessions, null, 2));
    console.log(`[Research] Session ${sessionId} saved to disk`);
  } catch (error) {
    console.error(`[Research] Failed to save session ${sessionId}:`, error);
  }
};

// Load sessions from file
export const loadSessions = (): void => {
  try {
    if (!fs.existsSync(SESSIONS_FILE)) {
      console.log('[Research] No existing sessions file found, starting fresh');
      return;
    }
    
    const fileContent = fs.readFileSync(SESSIONS_FILE, 'utf-8');
    const sessionsData = JSON.parse(fileContent);
    
    // Clear existing sessions and load from file
    researchSessions.clear();
    
    for (const [sessionId, sessionData] of Object.entries(sessionsData)) {
      const session = deserializeSession(sessionData);
      researchSessions.set(sessionId, session);
    }
    
    console.log(`[Research] Loaded ${researchSessions.size} sessions from disk`);
  } catch (error) {
    console.error('[Research] Failed to load sessions:', error);
  }
};

// Delete session from storage
export const deleteSession = (sessionId: string): void => {
  try {
    researchSessions.delete(sessionId);
    
    if (fs.existsSync(SESSIONS_FILE)) {
      const fileContent = fs.readFileSync(SESSIONS_FILE, 'utf-8');
      const existingSessions = JSON.parse(fileContent);
      delete existingSessions[sessionId];
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify(existingSessions, null, 2));
    }
    
    console.log(`[Research] Session ${sessionId} deleted`);
  } catch (error) {
    console.error(`[Research] Failed to delete session ${sessionId}:`, error);
  }
};

// Initialize sessions on module load
loadSessions();