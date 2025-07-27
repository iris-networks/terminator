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
  const sendMessage = useCallback((content: string, metadata?: { agentType?: string }) => {
    if (!socket || !currentSessionId || isLoading) return;
    
    setIsLoading(true);
    socket.emit('send_message', {
      sessionId: currentSessionId,
      content,
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

    const handleToolResult = (data: {
      messageId: string;
      toolCall: ToolCall;
    }) => {
      // Add or update tool call to the streaming message
      setMessages(prev => {
        return prev.map(msg => {
          if (msg.id === data.messageId) {
            const updatedToolCalls = [...(msg.toolCalls || [])];
            const existingIndex = updatedToolCalls.findIndex(tc => tc.id === data.toolCall.id);
            
            if (existingIndex >= 0) {
              updatedToolCalls[existingIndex] = data.toolCall;
            } else {
              updatedToolCalls.push(data.toolCall);
            }
            
            return {
              ...msg,
              toolCalls: updatedToolCalls,
            };
          }
          return msg;
        });
      });
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

  // Load sessions when connected
  useEffect(() => {
    if (connected) {
      loadSessions();
    }
  }, [connected, loadSessions]);

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