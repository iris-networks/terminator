import { ChatSession, ChatMessage } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';
import { databaseService } from './DatabaseService.js';

export class SessionService {
  private sessions = new Map<string, ChatSession>();

  async createSession(title?: string): Promise<ChatSession> {
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

    // Save to database
    await databaseService.createSession(session);
    
    // Keep in memory cache for faster access
    this.sessions.set(session.id, session);
    return session;
  }

  async getSession(sessionId: string): Promise<ChatSession | undefined> {
    // Try memory cache first
    let session = this.sessions.get(sessionId);
    if (session) {
      return session;
    }

    // Load from database if not in cache
    session = (await databaseService.getSession(sessionId)) || undefined;
    if (session) {
      this.sessions.set(sessionId, session);
      return session;
    }
    
    return undefined;
  }

  async getAllSessions(): Promise<ChatSession[]> {
    // Load all sessions from database to ensure we have the latest data
    const sessions = await databaseService.getAllSessions();
    
    // Update memory cache
    this.sessions.clear();
    for (const session of sessions) {
      this.sessions.set(session.id, session);
    }
    
    return sessions;
  }

  async updateSession(sessionId: string, updates: Partial<ChatSession>): Promise<ChatSession | undefined> {
    let session = this.sessions.get(sessionId);
    if (!session) {
      // Try loading from database
      const dbSession = await databaseService.getSession(sessionId);
      if (!dbSession) return undefined;
      this.sessions.set(sessionId, dbSession);
      session = dbSession;
    }

    const currentSession = session;
    const updatedSession = {
      ...currentSession,
      ...updates,
      updatedAt: new Date(),
    };

    // Update database
    await databaseService.updateSession(sessionId, updates);
    
    // Update memory cache
    this.sessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    // Delete from database
    const deleted = await databaseService.deleteSession(sessionId);
    
    // Remove from memory cache
    this.sessions.delete(sessionId);
    
    return deleted;
  }

  async addMessage(sessionId: string, message: Omit<ChatMessage, 'id' | 'sessionId' | 'timestamp'>): Promise<ChatMessage | undefined> {
    let session = this.sessions.get(sessionId);
    if (!session) {
      // Try loading from database
      const dbSession = await databaseService.getSession(sessionId);
      if (!dbSession) return undefined;
      this.sessions.set(sessionId, dbSession);
      session = dbSession;
    }

    const newMessage: ChatMessage = {
      ...message,
      id: uuidv4(),
      sessionId,
      timestamp: new Date(),
    };

    // Add to database first
    await databaseService.addMessage(newMessage);

    // Update memory cache
    session.messages.push(newMessage);
    session.updatedAt = new Date();
    
    // Update metadata
    const newMetadata = {
      ...session.metadata,
      messageCount: session.messages.length,
      totalTokens: (session.metadata?.totalTokens || 0) + (message.metadata?.tokens || 0),
    };
    session.metadata = newMetadata;

    // Auto-generate title from first user message
    if (session.messages.length === 1 && message.role === 'user' && session.title === 'New Conversation') {
      const generatedTitle = this.generateTitle(message.content);
      session.title = generatedTitle;
      
      // Update title in database
      await databaseService.updateSession(sessionId, { 
        title: generatedTitle,
        metadata: newMetadata 
      });
    } else {
      // Update metadata in database
      await databaseService.updateSession(sessionId, { metadata: newMetadata });
    }

    this.sessions.set(sessionId, session);
    return newMessage;
  }

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    let session = this.sessions.get(sessionId);
    if (!session) {
      // Try loading from database
      const dbSession = await databaseService.getSession(sessionId);
      if (!dbSession) return [];
      this.sessions.set(sessionId, dbSession);
      session = dbSession;
    }
    return session.messages || [];
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
  async getSessionStats(sessionId: string) {
    let session = this.sessions.get(sessionId);
    if (!session) {
      // Try loading from database
      const dbSession = await databaseService.getSession(sessionId);
      if (!dbSession) return null;
      this.sessions.set(sessionId, dbSession);
      session = dbSession;
    }

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
  async clearAllSessions(): Promise<void> {
    await databaseService.clearAllSessions();
    this.sessions.clear();
  }
}

// Global session service instance
export const sessionService = new SessionService();