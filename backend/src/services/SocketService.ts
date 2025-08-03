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
import { Server, Socket } from 'socket.io';
import { AIService } from './AIService.js';
import { sessionService } from './SessionService.js';
import { ChatMessage } from '../types/index.js';
import { ReplayEvent, SessionReplayData } from '../types/replay.js';

export class SocketService {
  private io: Server;
  private sessionEvents: Map<string, ReplayEvent[]> = new Map();

  constructor(io: Server) {
    this.io = io;
  }

  private addReplayEvent(sessionId: string, event: Omit<ReplayEvent, 'id' | 'timestamp' | 'sessionId'>): void {
    const replayEvent: ReplayEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: Date.now(),
      sessionId,
      ...event
    };

    if (!this.sessionEvents.has(sessionId)) {
      this.sessionEvents.set(sessionId, []);
    }
    
    this.sessionEvents.get(sessionId)!.push(replayEvent);
  }

  getSessionReplayData(sessionId: string): SessionReplayData | null {
    const events = this.sessionEvents.get(sessionId);
    if (!events || events.length === 0) return null;

    const startTime = events[0]?.timestamp || Date.now();
    const endTime = events[events.length - 1]?.timestamp;
    
    const toolCalls = events.filter(e => e.type === 'tool_call').length;
    const messages = events.filter(e => e.type === 'user_message' || e.type === 'assistant_message').length;

    return {
      sessionId,
      startTime,
      endTime,
      events,
      metadata: {
        totalMessages: messages,
        totalToolCalls: toolCalls,
      }
    };
  }

  initialize() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // Join session room
      socket.on('join_session', (sessionId: string) => {
        socket.join(sessionId);
        console.log(`👥 Client ${socket.id} joined session: ${sessionId}`);
        
        // Send existing messages
        sessionService.getMessages(sessionId).then(messages => {
          socket.emit('session_messages', messages);
        });
      });

      // Leave session room
      socket.on('leave_session', (sessionId: string) => {
        socket.leave(sessionId);
        console.log(`👋 Client ${socket.id} left session: ${sessionId}`);
      });

      // Handle new messages
      socket.on('send_message', async (data: {
        sessionId: string;
        content: string;
        attachments?: string[];
        metadata?: { agentType?: string };
      }) => {
        try {
          const { sessionId, content, attachments, metadata } = data;
          
          // Create session if it doesn't exist
          let session = await sessionService.getSession(sessionId);
          if (!session) {
            session = await sessionService.createSession();
          }

          // Add user message with metadata
          const userMessage = await sessionService.addMessage(sessionId, {
            role: 'user',
            content,
            attachments,
            metadata,
          });

          if (!userMessage) {
            socket.emit('error', { message: 'Failed to add message' });
            return;
          }

          // Record user message event
          this.addReplayEvent(sessionId, {
            type: 'user_message',
            data: userMessage
          });

          // Broadcast user message to all clients in the session
          this.io.to(sessionId).emit('new_message', userMessage);

          // Send thinking indicator
          this.addReplayEvent(sessionId, {
            type: 'assistant_thinking',
            data: { thinking: true }
          });
          socket.emit('assistant_thinking', true);

          // Create AI service with agent type if specified
          const aiService = new AIService({
            model: process.env.AI_MODEL || 'gpt-4-turbo-preview',
            provider: (process.env.AI_PROVIDER as 'openai' | 'anthropic') || 'openai',
            temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
            maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4000'),
            agentType: metadata?.agentType as any || 'basic',
          });

          // Get all messages for context
          const allMessages = await sessionService.getMessages(sessionId);

          // Generate AI response using streaming
          let assistantContent = '';
          const toolCalls: any[] = [];
          const assistantMessageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

          try {
            // Create callback for tool results
            const onToolResult = (toolResult: any) => {
              // Record tool call and result events
              this.addReplayEvent(sessionId, {
                type: 'tool_call',
                data: { 
                  toolName: toolResult.toolName, 
                  args: toolResult.args,
                  timestamp: toolResult.timestamp 
                }
              });
              
              this.addReplayEvent(sessionId, {
                type: 'tool_result',
                data: toolResult
              });
              
              socket.emit('tool_result', toolResult);
            };

            for await (const chunk of aiService.streamResponse(allMessages, onToolResult)) {
              switch (chunk.type) {
                case 'content':
                  assistantContent += chunk.data;
                  
                  // Record message chunk event
                  this.addReplayEvent(sessionId, {
                    type: 'message_chunk',
                    data: {
                      messageId: assistantMessageId,
                      content: chunk.data,
                      type: 'content'
                    }
                  });
                  
                  // Stream content to client
                  socket.emit('message_chunk', {
                    messageId: assistantMessageId,
                    content: chunk.data,
                    type: 'content',
                  });
                  break;

                case 'tool_call':
                  // Collect tool calls and emit them
                  const toolCall = {
                    ...chunk.data,
                    status: chunk.data.error ? 'error' : 'success',
                  };
                  toolCalls.push(toolCall);
                  break;

                case 'done':
                  // Finalize message with tool calls
                  const assistantMessage = await sessionService.addMessage(sessionId, {
                    role: 'assistant',
                    content: assistantContent,
                    toolCalls: toolCalls,
                    metadata: {
                      tokens: chunk.data.usage?.totalTokens || 0,
                      agentType: metadata?.agentType,
                    },
                  });

                  if (assistantMessage) {
                    // Record assistant message event
                    this.addReplayEvent(sessionId, {
                      type: 'assistant_message',
                      data: assistantMessage
                    });
                    
                    this.io.to(sessionId).emit('message_complete', {
                      messageId: assistantMessageId,
                      message: assistantMessage,
                    });
                  }
                  break;
              }
            }
          } catch (error) {
            console.error('AI generation error:', error);
            socket.emit('error', { 
              message: 'Failed to generate response',
              details: error instanceof Error ? error.message : 'Unknown error',
            });
          } finally {
            socket.emit('assistant_thinking', false);
          }

        } catch (error) {
          console.error('Message handling error:', error);
          socket.emit('error', { 
            message: 'Failed to process message',
            details: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });

      // Handle session management
      socket.on('create_session', async () => {
        const session = await sessionService.createSession();
        socket.emit('session_created', session);
      });

      socket.on('get_sessions', async () => {
        const sessions = await sessionService.getAllSessions();
        socket.emit('sessions_list', sessions);
      });

      socket.on('delete_session', async (sessionId: string) => {
        const deleted = await sessionService.deleteSession(sessionId);
        if (deleted) {
          this.io.emit('session_deleted', sessionId);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`❌ Socket error from ${socket.id}:`, error);
      });
    });
  }

  // Broadcast message to all clients in a session
  broadcastToSession(sessionId: string, event: string, data: any) {
    this.io.to(sessionId).emit(event, data);
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.io.sockets.sockets.size;
  }
}