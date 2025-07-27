export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sessionId: string;
  metadata?: {
    model?: string;
    tokens?: number;
    thinking?: boolean;
    toolCalls?: ToolCall[];
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

export interface AgentConfig {
  model: string;
  provider: 'openai' | 'anthropic';
  temperature?: number;
  maxTokens?: number;
  tools?: Tool[];
}

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (args: Record<string, any>) => Promise<any>;
}

export interface ApiError extends Error {
  status: number;
  code: string;
}