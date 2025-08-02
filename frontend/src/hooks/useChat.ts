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
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';

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

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  thinking?: boolean;
  toolCalls?: ToolCall[];
  metadata?: {
    tokens?: number;
    agentType?: string;
  };
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

export const useChat = () => {
  const { socket, connected } = useSocket();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  // Create a new session
  const createSession = useCallback(() => {
    if (!socket) return;
    
    socket.emit('create_session');
  }, [socket]);

  // Join a session
  const joinSession = useCallback((sessionId: string) => {
    if (!socket) return;
    
    // Leave current session if any
    if (currentSessionId) {
      socket.emit('leave_session', currentSessionId);
    }
    
    // Join new session
    socket.emit('join_session', sessionId);
    setCurrentSessionId(sessionId);
    setMessages([]);
  }, [socket, currentSessionId]);

  // Send a message
  const sendMessage = useCallback(async (
    content: string, 
    attachments: File[],
    metadata?: { agentType?: string }
  ) => {
    if (!socket || !currentSessionId || isLoading) return;
    
    setIsLoading(true);

    let attachmentUrls: string[] = [];

    if (attachments.length > 0) {
      const formData = new FormData();
      attachments.forEach(file => {
        formData.append('files', file);
      });

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('File upload failed');
        }

        const data = await response.json();
        attachmentUrls = data.files;

      } catch (error) {
        console.error('Error uploading files:', error);
        setIsLoading(false);
        // Optionally, show an error message to the user
        return;
      }
    }
    
    socket.emit('send_message', {
      sessionId: currentSessionId,
      content,
      attachments: attachmentUrls,
      metadata,
    });
  }, [socket, currentSessionId, isLoading]);

  // Load all sessions
  const loadSessions = useCallback(() => {
    if (!socket) return;
    
    socket.emit('get_sessions');
  }, [socket]);

  // Delete a session
  const deleteSession = useCallback((sessionId: string) => {
    if (!socket) return;
    
    socket.emit('delete_session', sessionId);
  }, [socket]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    // Session events
    const handleSessionCreated = (session: ChatSession) => {
      setSessions(prev => [session, ...prev]);
      joinSession(session.id);
    };

    const handleSessionsList = (sessionsList: ChatSession[]) => {
      setSessions(sessionsList);
    };

    const handleSessionDeleted = (sessionId: string) => {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }
    };

    // Message events
    const handleSessionMessages = (sessionMessages: Message[]) => {
      setMessages(sessionMessages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })));
    };

    const handleNewMessage = (message: Message) => {
      setMessages(prev => [...prev, {
        ...message,
        timestamp: new Date(message.timestamp),
      }]);
    };

    const handleAssistantThinking = (thinking: boolean) => {
      setIsThinking(thinking);
      if (thinking) {
        // Add thinking message
        setMessages(prev => [...prev, {
          id: 'thinking',
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          thinking: true,
        }]);
      } else {
        // Remove thinking message
        setMessages(prev => prev.filter(msg => msg.id !== 'thinking'));
        setIsLoading(false);
      }
    };

    const handleMessageChunk = (data: {
      messageId: string;
      content: string;
      type: 'content' | 'tool_call';
    }) => {
      if (data.type === 'content') {
        // Update or create streaming message
        setMessages(prev => {
          const existingIndex = prev.findIndex(msg => msg.id === data.messageId);
          if (existingIndex >= 0) {
            // Update existing message
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              content: updated[existingIndex].content + data.content,
            };
            return updated;
          } else {
            // Create new streaming message
            return [...prev, {
              id: data.messageId,
              role: 'assistant',
              content: data.content,
              timestamp: new Date(),
            }];
          }
        });
      }
    };


    const handleMessageComplete = (data: {
      messageId: string;
      message: Message;
    }) => {
      // Replace streaming message with final message
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== data.messageId);
        return [...filtered, {
          ...data.message,
          timestamp: new Date(data.message.timestamp),
          toolCalls: data.message.toolCalls?.map(tc => ({
            ...tc,
            timestamp: new Date(tc.timestamp),
          })),
        }];
      });
      setIsThinking(false);
      setIsLoading(false);
    };

    const handleToolResult = (data: {
      messageId: string;
      content: any[];
    }) => {
      // Process tool result data
      if (data.content && data.content.length > 0) {
        data.content.forEach((contentPart: any) => {
          // Convert to ToolCall format for inline display in messages
          const toolCall: ToolCall = {
            id: `${data.messageId}_${contentPart.toolName}`,
            name: contentPart.toolName || contentPart.name || 'unknown',
            arguments: contentPart.toolInput || {},
            result: contentPart.toolResult || {},
            timestamp: new Date(contentPart.timestamp || new Date().toISOString()),
            status: contentPart.status || 'success',
            error: contentPart.status === 'error' ? String(contentPart.toolResult) : undefined,
          };

          // Add tool call to the most recent assistant message
          setMessages(prev => {
            // Find the most recent assistant message that's not thinking
            for (let i = prev.length - 1; i >= 0; i--) {
              const msg = prev[i];
              if (msg.role === 'assistant' && !msg.thinking) {
                const updated = [...prev];
                updated[i] = {
                  ...msg,
                  toolCalls: [...(msg.toolCalls || []), toolCall],
                };
                return updated;
              }
            }
            return prev;
          });
        });
      }
    };

    const handleError = (error: { message: string; details?: string }) => {
      console.error('Chat error:', error);
      setIsThinking(false);
      setIsLoading(false);
      
      // Add error message
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        role: 'system',
        content: `Error: ${error.message}`,
        timestamp: new Date(),
      }]);
    };

    // Register event listeners
    socket.on('session_created', handleSessionCreated);
    socket.on('sessions_list', handleSessionsList);
    socket.on('session_deleted', handleSessionDeleted);
    socket.on('session_messages', handleSessionMessages);
    socket.on('new_message', handleNewMessage);
    socket.on('assistant_thinking', handleAssistantThinking);
    socket.on('message_chunk', handleMessageChunk);
    socket.on('tool_result', handleToolResult);
    socket.on('message_complete', handleMessageComplete);
    socket.on('error', handleError);

    return () => {
      socket.off('session_created', handleSessionCreated);
      socket.off('sessions_list', handleSessionsList);
      socket.off('session_deleted', handleSessionDeleted);
      socket.off('session_messages', handleSessionMessages);
      socket.off('new_message', handleNewMessage);
      socket.off('assistant_thinking', handleAssistantThinking);
      socket.off('message_chunk', handleMessageChunk);
      socket.off('tool_result', handleToolResult);
      socket.off('message_complete', handleMessageComplete);
      socket.off('error', handleError);
    };
  }, [socket, currentSessionId, joinSession]);

  // Load sessions when connected and auto-create session if needed
  useEffect(() => {
    if (connected) {
      loadSessions();
    }
  }, [connected, loadSessions]);

  // Auto-create session when connected and no active session
  useEffect(() => {
    if (connected && !currentSessionId) {
      createSession();
    }
  }, [connected, currentSessionId, createSession]);

  return {
    // State
    sessions,
    currentSessionId,
    messages,
    isLoading,
    isThinking,
    connected,

    // Actions
    createSession,
    joinSession,
    sendMessage,
    loadSessions,
    deleteSession,
  };
};