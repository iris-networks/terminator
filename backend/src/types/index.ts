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

export interface AgentConfig {
  model: string;
  provider: 'openai' | 'anthropic';
  temperature?: number;
  maxTokens?: number;
  agentType?: 'basic' | 'codeact' | 'deep_research' | 'gui' | 'multi_agent';
}

export interface ApiError extends Error {
  status: number;
  code: string;
}