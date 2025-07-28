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


  private async getToolsForCurrentAgent() {
    // Always use all tools since we only have multi-agent now
    return await getAgentTools(AgentType.MULTI_AGENT);
  }

  async generateResponse(messages: ChatMessage[]): Promise<AgentResponse> {
    const startTime = Date.now();
    
    try {
      const result = await generateText({
        model: this.getModel(),
        messages: messages,
        tools: await this.getToolsForCurrentAgent(),
        temperature: this.config.temperature || 0.7,
        maxTokens: this.config.maxTokens || 4000,
      });

      const toolCalls: ToolCall[] = result.toolCalls?.map(call => ({
        id: call.toolCallId,
        name: call.toolName,
        arguments: call.args,
        timestamp: new Date(),
        status: 'success' as const,
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
      const stream = await streamText({
        model: this.getModel(),
        messages: messages,
        tools: await this.getToolsForCurrentAgent(),
        temperature: this.config.temperature || 0.7,
        maxTokens: this.config.maxTokens || 4000,
        maxSteps: 5
      });

      for await (const chunk of stream.textStream) {
        yield {
          type: 'content',
          data: chunk,
        };
      }

      // Get usage info from the stream result
      const usage = await stream.usage;
      
      // Tool calls are handled through the stream itself, not the final result

      yield {
        type: 'done',
        data: {
          usage: usage || { totalTokens: 0, promptTokens: 0, completionTokens: 0 },
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