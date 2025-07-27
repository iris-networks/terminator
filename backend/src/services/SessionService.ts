import { ChatSession, ChatMessage } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export class SessionService {
  private sessions = new Map<string, ChatSession>();

  createSession(title?: string): ChatSession {
    const session: ChatSession = {
      id: uuidv4(),
      title: title || 'New Conversation',
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [],
      metadata: {
        totalTokens: 0,
        messageCount: 0,
      },
    };

    this.sessions.set(session.id, session);
    return session;
  }

  getSession(sessionId: string): ChatSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): ChatSession[] {
    return Array.from(this.sessions.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  updateSession(sessionId: string, updates: Partial<ChatSession>): ChatSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    const updatedSession = {
      ...session,
      ...updates,
      updatedAt: new Date(),
    };

    this.sessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  addMessage(sessionId: string, message: Omit<ChatMessage, 'id' | 'sessionId' | 'timestamp'>): ChatMessage | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    const newMessage: ChatMessage = {
      ...message,
      id: uuidv4(),
      sessionId,
      timestamp: new Date(),
    };

    session.messages.push(newMessage);
    session.updatedAt = new Date();
    
    // Update metadata
    session.metadata = {
      ...session.metadata,
      messageCount: session.messages.length,
      totalTokens: (session.metadata?.totalTokens || 0) + (message.metadata?.tokens || 0),
    };

    // Auto-generate title from first user message
    if (session.messages.length === 1 && message.role === 'user' && session.title === 'New Conversation') {
      session.title = this.generateTitle(message.content);
    }

    this.sessions.set(sessionId, session);
    return newMessage;
  }

  getMessages(sessionId: string): ChatMessage[] {
    const session = this.sessions.get(sessionId);
    return session?.messages || [];
  }

  private generateTitle(content: string): string {
    // Generate a title from the first user message
    const cleaned = content.trim().replace(/\\n+/g, ' ');
    const maxLength = 50;
    
    if (cleaned.length <= maxLength) {
      return cleaned;
    }
    
    // Try to break at word boundaries
    const truncated = cleaned.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.6) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }

  // Get session statistics
  getSessionStats(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const userMessages = session.messages.filter(m => m.role === 'user').length;
    const assistantMessages = session.messages.filter(m => m.role === 'assistant').length;
    const totalTokens = session.metadata?.totalTokens || 0;

    return {
      messageCount: session.messages.length,
      userMessages,
      assistantMessages,
      totalTokens,
      createdAt: session.createdAt,
      lastActivity: session.updatedAt,
    };
  }

  // Clear all sessions (useful for development)
  clearAllSessions(): void {
    this.sessions.clear();
  }
}

// Global session service instance
export const sessionService = new SessionService();