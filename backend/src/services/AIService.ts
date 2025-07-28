import { generateText, streamText, CoreMessage, LanguageModelV1 } from 'ai';
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
        model: this.getModel() as LanguageModelV1,
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

  async *streamResponse(messages: ChatMessage[], onToolResult?: (toolResult: any) => void): AsyncGenerator<{
    type: 'content' | 'tool_call' | 'done';
    data: any;
  }> {
    try {
      const stream = streamText({
        model: this.getModel() as LanguageModelV1,
        messages: messages,
        tools: await this.getToolsForCurrentAgent(),
        temperature: this.config.temperature || 0.7,
        maxTokens: this.config.maxTokens || 4000,
        maxSteps: 20,
        onStepFinish: (({toolResults}) => {
          // Emit tool results if callback provided
          if (onToolResult && toolResults && toolResults.length > 0) {
            toolResults.forEach((result: any) => {
              // Determine the content type and structure data appropriately
              let contentPart: any = {
                type: 'generic',
                name: result.toolName,
                toolName: result.toolName || 'unknown',
                toolInput: result.args || {},
                toolResult: result.result || {},
                status: result.result ? 'success' : 'error',
                timestamp: new Date().toISOString(),
                fullJson: JSON.stringify({
                  toolName: result.toolName,
                  args: result.args,
                  result: result.result,
                  timestamp: new Date().toISOString()
                }, null, 2)
              };

              // Enhanced content type detection and structuring
              if (result.toolName) {
                // Command execution tools
                if (['execute_command', 'shell_execute', 'bash'].includes(result.toolName)) {
                  contentPart.type = 'command_result';
                  contentPart.command = result.args?.command || '';
                  contentPart.stdout = result.result?.stdout || result.result?.output || '';
                  contentPart.stderr = result.result?.stderr || result.result?.error || '';
                  contentPart.exitCode = result.result?.exitCode ?? result.result?.exit_code;
                }
                // Script execution tools
                else if (['python_execute', 'node_execute', 'script_execute'].includes(result.toolName)) {
                  contentPart.type = 'script_result';
                  contentPart.script = result.args?.script || result.args?.code || '';
                  contentPart.interpreter = result.args?.interpreter || 'python';
                  contentPart.stdout = result.result?.stdout || result.result?.output || '';
                  contentPart.stderr = result.result?.stderr || result.result?.error || '';
                  contentPart.exitCode = result.result?.exitCode ?? result.result?.exit_code;
                  contentPart.cwd = result.args?.cwd || '';
                }
                // JSON/data tools
                else if (result.toolName.includes('json') || typeof result.result === 'object') {
                  contentPart.type = 'json';
                }
              }

              onToolResult({
                messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
                content: [contentPart]
              });
            });
          }
        })
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