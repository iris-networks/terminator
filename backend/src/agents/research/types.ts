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

// Global state for research sessions
export const researchSessions = new Map<string, ResearchSession>();