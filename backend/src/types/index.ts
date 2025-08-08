export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: string[];
  timestamp: Date;
  sessionId: string;
  toolCalls?: ToolCall[];
  metadata?: {
    model?: string;
    tokens?: number;
    thinking?: boolean;
    agentType?: string;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
  metadata?: {
    model?: string;
    totalTokens?: number;
    messageCount?: number;
  };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: any;
  error?: string;
  timestamp: Date;
  duration?: number;
  status: 'running' | 'success' | 'error';
}

export interface AgentResponse {
  content: string;
  toolCalls?: ToolCall[];
  thinking?: boolean;
  metadata?: {
    model: string;
    tokens: number;
    duration: number;
  };
}

export interface StreamChunk {
  type: 'content' | 'tool_call' | 'thinking' | 'done';
  data: any;
  timestamp: Date;
}

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'ollama' | 'openrouter';

export interface AgentConfig {
  model: string;
  provider: AIProvider;
  temperature?: number;
  maxTokens?: number;
  baseURL?: string;
  agentType?: 'basic' | 'codeact' | 'deep_research' | 'gui' | 'multi_agent';
}

export interface ApiError extends Error {
  status: number;
  code: string;
}