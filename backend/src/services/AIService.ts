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
                // CodeAct tools
                else if (['node_codeact', 'python_codeact', 'shell_codeact'].includes(result.toolName)) {
                  contentPart.type = result.toolName; // Use specific type for CodeAct renderer
                  contentPart.code = result.args?.code || '';
                  contentPart.output = result.result?.output || '';
                  contentPart.error = result.result?.error || '';
                  contentPart.exitCode = result.result?.exitCode;
                  contentPart.success = result.result?.success;
                  contentPart.duration = result.result?.duration;
                  contentPart.filename = result.result?.filename;
                  contentPart.workspace = result.result?.workspace;
                  contentPart.memoryKey = result.result?.memoryKey;
                }
                // CodeAct memory tool
                else if (result.toolName === 'codeact_memory') {
                  contentPart.type = 'codeact_memory';
                  contentPart.action = result.args?.action || '';
                  contentPart.key = result.args?.key || '';
                  contentPart.value = result.result?.value;
                  contentPart.success = result.result?.success;
                }
                // DeepResearch tools
                else if (['search', 'visit_link', 'deep_dive', 'research_plan', 'report_generator'].includes(result.toolName)) {
                  contentPart.type = result.toolName; // Use specific type for DeepResearch renderer
                  // Keep all result data for specialized renderers
                  contentPart.query = result.args?.query;
                  contentPart.sessionId = result.args?.sessionId;
                  contentPart.topic = result.result?.topic;
                  contentPart.plan = result.result?.plan;
                  contentPart.report = result.result?.report;
                  contentPart.sources = result.result?.sources;
                  contentPart.insights = result.result?.insights;
                  contentPart.isDeepResearch = result.result?.isDeepResearch || false;
                }
                // Web search (enhanced)
                else if (result.toolName === 'web_search') {
                  contentPart.type = 'web_search';
                }
                // Browser tools
                else if (result.toolName.startsWith('browser_')) {
                  if (['browser_vision_control', 'browser_control', 'browser_click'].includes(result.toolName)) {
                    contentPart.type = 'browser_control';
                  } else {
                    contentPart.type = 'browser_result';
                    
                    // Structure data for BrowserResultRenderer
                    const toolResult = result.result || {};
                    
                    // Handle browser_navigate results
                    if (result.toolName === 'browser_navigate') {
                      contentPart.url = result.args?.url || toolResult.url || toolResult.finalUrl;
                      contentPart.title = toolResult.title || toolResult.navigatedTo || 'Navigation Result';
                      contentPart.content = toolResult.content || `Navigated to ${contentPart.url}`;
                      contentPart.contentType = 'text';
                      
                      // Add screenshot if available
                      if (toolResult.screenshot || toolResult.screenshotPath) {
                        contentPart._extra = {
                          currentScreenshot: toolResult.screenshot || toolResult.screenshotPath
                        };
                      }
                    }
                    
                    // Handle browser_get_markdown results  
                    else if (result.toolName === 'browser_get_markdown') {
                      contentPart.url = toolResult.url || '';
                      contentPart.title = toolResult.title || 'Page Content';
                      contentPart.content = toolResult.content || toolResult.markdown || '';
                      contentPart.contentType = 'markdown';
                      
                      // Add pagination info if available
                      if (toolResult.pagination) {
                        contentPart._extra = {
                          pagination: toolResult.pagination
                        };
                      }
                    }
                    
                    // Handle browser_evaluate results
                    else if (result.toolName === 'browser_evaluate') {
                      contentPart.url = toolResult.url || '';
                      contentPart.title = `JavaScript Evaluation: ${result.args?.expression || 'Script'}`;
                      contentPart.content = `**Expression:** \`${result.args?.expression || 'N/A'}\`\n\n**Result:** \`\`\`json\n${JSON.stringify(toolResult.result || toolResult, null, 2)}\n\`\`\``;
                      contentPart.contentType = 'markdown';
                    }
                    
                    // Handle browser_scroll results
                    else if (result.toolName === 'browser_scroll') {
                      contentPart.url = toolResult.url || '';
                      contentPart.title = `Page Scrolled: ${result.args?.direction || 'Unknown Direction'}`;
                      contentPart.content = `Scrolled ${result.args?.direction || 'unknown direction'}${result.args?.amount ? ` by ${result.args.amount}px` : ''}`;
                      contentPart.contentType = 'text';
                      
                      // Add screenshot if available after scroll
                      if (toolResult.screenshot) {
                        contentPart._extra = {
                          currentScreenshot: toolResult.screenshot
                        };
                      }
                    }
                    
                    // Handle browser_screenshot results
                    else if (result.toolName === 'browser_screenshot') {
                      contentPart.url = toolResult.url || '';
                      contentPart.title = 'Browser Screenshot';
                      contentPart.content = 'Screenshot captured';
                      contentPart.contentType = 'text';
                      
                      if (toolResult.screenshot || toolResult.screenshotPath) {
                        contentPart._extra = {
                          currentScreenshot: toolResult.screenshot || toolResult.screenshotPath
                        };
                      }
                    }
                    
                    // Handle other browser tools with generic structure
                    else {
                      contentPart.url = toolResult.url || '';
                      contentPart.title = result.toolName.replace('browser_', '').replace('_', ' ').toUpperCase();
                      contentPart.content = typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult, null, 2);
                      contentPart.contentType = typeof toolResult === 'string' ? 'text' : 'json';
                    }
                  }
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