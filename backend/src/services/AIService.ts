import { generateText, streamText, CoreMessage } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { AgentConfig, AgentResponse, ChatMessage, ToolCall } from '../types/index.js';
import { defaultAgentTools, getAgentTools, AgentType } from '../agents/AgentTARS.js';

export class AIService {
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  private getModel() {
    const { provider, model } = this.config;
    
    switch (provider) {
      case 'openai':
        return openai(model);
      case 'anthropic':
        return anthropic(model);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  private formatMessages(messages: ChatMessage[]): CoreMessage[] {
    return messages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));
  }

  private getToolsForCurrentAgent() {
    if (this.config.agentType) {
      return getAgentTools(this.config.agentType as AgentType);
    }
    return defaultAgentTools;
  }

  async generateResponse(messages: ChatMessage[]): Promise<AgentResponse> {
    const startTime = Date.now();
    
    try {
      const result = await generateText({
        model: this.getModel(),
        messages: this.formatMessages(messages),
        tools: this.getToolsForCurrentAgent(),
        temperature: this.config.temperature || 0.7,
        maxTokens: this.config.maxTokens || 4000,
      });

      const toolCalls: ToolCall[] = result.toolCalls?.map(call => ({
        id: `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: call.toolName,
        arguments: call.args,
        result: call.result,
        timestamp: new Date(),
      })) || [];

      return {
        content: result.text,
        toolCalls,
        metadata: {
          model: this.config.model,
          tokens: result.usage?.totalTokens || 0,
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      throw new Error(`AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async *streamResponse(messages: ChatMessage[]): AsyncGenerator<{
    type: 'content' | 'tool_call' | 'done';
    data: any;
  }> {
    try {
      const stream = streamText({
        model: this.getModel(),
        messages: this.formatMessages(messages),
        tools: this.getToolsForCurrentAgent(),
        temperature: this.config.temperature || 0.7,
        maxTokens: this.config.maxTokens || 4000,
      });

      for await (const chunk of stream.textStream) {
        yield {
          type: 'content',
          data: chunk,
        };
      }

      // Handle tool calls after streaming
      const result = await stream.finishReason;
      if (result === 'tool-calls') {
        const finalResult = await stream.response;
        for (const toolCall of finalResult.toolCalls || []) {
          yield {
            type: 'tool_call',
            data: {
              id: `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: toolCall.toolName,
              arguments: toolCall.args,
              result: toolCall.result,
              timestamp: new Date(),
            },
          };
        }
      }

      yield {
        type: 'done',
        data: {
          usage: (await stream.response).usage,
        },
      };
    } catch (error) {
      throw new Error(`AI streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  updateConfig(config: Partial<AgentConfig>) {
    this.config = { ...this.config, ...config };
  }
}