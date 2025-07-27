import { Server, Socket } from 'socket.io';
import { AIService } from './AIService.js';
import { sessionService } from './SessionService.js';
import { ChatMessage } from '../types/index.js';

export class SocketService {
  private io: Server;
  private aiService: AIService;

  constructor(io: Server) {
    this.io = io;
    this.aiService = new AIService({
      model: 'gpt-4-turbo-preview',
      provider: 'openai',
      temperature: 0.7,
      maxTokens: 4000,
    });
  }

  initialize() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // Join session room
      socket.on('join_session', (sessionId: string) => {
        socket.join(sessionId);
        console.log(`👥 Client ${socket.id} joined session: ${sessionId}`);
        
        // Send existing messages
        const messages = sessionService.getMessages(sessionId);
        socket.emit('session_messages', messages);
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
      }) => {
        try {
          const { sessionId, content } = data;
          
          // Create session if it doesn't exist
          let session = sessionService.getSession(sessionId);
          if (!session) {
            session = sessionService.createSession();
          }

          // Add user message
          const userMessage = sessionService.addMessage(sessionId, {
            role: 'user',
            content,
          });

          if (!userMessage) {
            socket.emit('error', { message: 'Failed to add message' });
            return;
          }

          // Broadcast user message to all clients in the session
          this.io.to(sessionId).emit('new_message', userMessage);

          // Send thinking indicator
          socket.emit('assistant_thinking', true);

          // Get all messages for context
          const allMessages = sessionService.getMessages(sessionId);

          // Generate AI response using streaming
          let assistantContent = '';
          const assistantMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          try {
            for await (const chunk of this.aiService.streamResponse(allMessages)) {
              switch (chunk.type) {
                case 'content':
                  assistantContent += chunk.data;
                  // Stream content to client
                  socket.emit('message_chunk', {
                    messageId: assistantMessageId,
                    content: chunk.data,
                    type: 'content',
                  });
                  break;

                case 'tool_call':
                  // Handle tool calls
                  socket.emit('message_chunk', {
                    messageId: assistantMessageId,
                    content: chunk.data,
                    type: 'tool_call',
                  });
                  break;

                case 'done':
                  // Finalize message
                  const assistantMessage = sessionService.addMessage(sessionId, {
                    role: 'assistant',
                    content: assistantContent,
                    metadata: {
                      tokens: chunk.data.usage?.totalTokens || 0,
                    },
                  });

                  if (assistantMessage) {
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
      socket.on('create_session', () => {
        const session = sessionService.createSession();
        socket.emit('session_created', session);
      });

      socket.on('get_sessions', () => {
        const sessions = sessionService.getAllSessions();
        socket.emit('sessions_list', sessions);
      });

      socket.on('delete_session', (sessionId: string) => {
        const deleted = sessionService.deleteSession(sessionId);
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