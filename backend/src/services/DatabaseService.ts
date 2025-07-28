import sqlite3 from 'sqlite3';
import { Database } from 'sqlite3';
import { ChatSession, ChatMessage, ToolCall } from '../types/index.js';
import path from 'path';
import fs from 'fs';

export class DatabaseService {
  private db: Database;
  private dbPath: string;
  private isInitialized = false;

  constructor(dbPath: string = './data/sessions.db') {
    this.dbPath = path.resolve(dbPath);
    
    // Ensure data directory exists
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.db = new sqlite3.Database(this.dbPath);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Create sessions table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            model TEXT,
            total_tokens INTEGER DEFAULT 0,
            message_count INTEGER DEFAULT 0
          )
        `, (err) => {
          if (err) {
            reject(new Error(`Failed to create sessions table: ${err.message}`));
            return;
          }
        });

        // Create messages table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
            content TEXT NOT NULL,
            timestamp DATETIME NOT NULL,
            model TEXT,
            tokens INTEGER,
            thinking INTEGER DEFAULT 0,
            agent_type TEXT,
            FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
          )
        `, (err) => {
          if (err) {
            reject(new Error(`Failed to create messages table: ${err.message}`));
            return;
          }
        });

        // Create tool_calls table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS tool_calls (
            id TEXT PRIMARY KEY,
            message_id TEXT NOT NULL,
            name TEXT NOT NULL,
            arguments TEXT NOT NULL,
            result TEXT,
            error TEXT,
            timestamp DATETIME NOT NULL,
            duration INTEGER,
            status TEXT NOT NULL CHECK (status IN ('running', 'success', 'error')),
            FOREIGN KEY (message_id) REFERENCES messages (id) ON DELETE CASCADE
          )
        `, (err) => {
          if (err) {
            reject(new Error(`Failed to create tool_calls table: ${err.message}`));
            return;
          }

          // Create indexes for better performance
          this.db.run(`CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages (session_id)`);
          this.db.run(`CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages (timestamp)`);
          this.db.run(`CREATE INDEX IF NOT EXISTS idx_tool_calls_message_id ON tool_calls (message_id)`);
          this.db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON sessions (updated_at)`);

          this.isInitialized = true;
          resolve();
        });
      });
    });
  }

  // Session methods
  async createSession(session: ChatSession): Promise<void> {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO sessions (id, title, created_at, updated_at, model, total_tokens, message_count)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        session.id,
        session.title,
        session.createdAt.toISOString(),
        session.updatedAt.toISOString(),
        session.metadata?.model || null,
        session.metadata?.totalTokens || 0,
        session.metadata?.messageCount || 0
      ], function(err) {
        if (err) {
          reject(new Error(`Failed to create session: ${err.message}`));
        } else {
          resolve();
        }
      });

      stmt.finalize();
    });
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT * FROM sessions WHERE id = ?
      `, [sessionId], async (err, row: any) => {
        if (err) {
          reject(new Error(`Failed to get session: ${err.message}`));
          return;
        }

        if (!row) {
          resolve(null);
          return;
        }

        try {
          const messages = await this.getMessages(sessionId);
          const session: ChatSession = {
            id: row.id,
            title: row.title,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            messages,
            metadata: {
              model: row.model,
              totalTokens: row.total_tokens,
              messageCount: row.message_count
            }
          };
          resolve(session);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async getAllSessions(): Promise<ChatSession[]> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM sessions ORDER BY updated_at DESC
      `, [], async (err, rows: any[]) => {
        if (err) {
          reject(new Error(`Failed to get sessions: ${err.message}`));
          return;
        }

        try {
          const sessions: ChatSession[] = [];
          for (const row of rows) {
            const messages = await this.getMessages(row.id);
            sessions.push({
              id: row.id,
              title: row.title,
              createdAt: new Date(row.created_at),
              updatedAt: new Date(row.updated_at),
              messages,
              metadata: {
                model: row.model,
                totalTokens: row.total_tokens,
                messageCount: row.message_count
              }
            });
          }
          resolve(sessions);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async updateSession(sessionId: string, updates: Partial<ChatSession>): Promise<void> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const fields: string[] = [];
      const values: any[] = [];

      if (updates.title !== undefined) {
        fields.push('title = ?');
        values.push(updates.title);
      }

      if (updates.metadata?.model !== undefined) {
        fields.push('model = ?');
        values.push(updates.metadata.model);
      }

      if (updates.metadata?.totalTokens !== undefined) {
        fields.push('total_tokens = ?');
        values.push(updates.metadata.totalTokens);
      }

      if (updates.metadata?.messageCount !== undefined) {
        fields.push('message_count = ?');
        values.push(updates.metadata.messageCount);
      }

      fields.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(sessionId);

      const stmt = this.db.prepare(`
        UPDATE sessions SET ${fields.join(', ')} WHERE id = ?
      `);

      stmt.run(values, function(err) {
        if (err) {
          reject(new Error(`Failed to update session: ${err.message}`));
        } else {
          resolve();
        }
      });

      stmt.finalize();
    });
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare('DELETE FROM sessions WHERE id = ?');
      
      stmt.run([sessionId], function(err) {
        if (err) {
          reject(new Error(`Failed to delete session: ${err.message}`));
        } else {
          resolve(this.changes > 0);
        }
      });

      stmt.finalize();
    });
  }

  // Message methods
  async addMessage(message: ChatMessage): Promise<void> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Insert message
        const stmt = this.db.prepare(`
          INSERT INTO messages (id, session_id, role, content, timestamp, model, tokens, thinking, agent_type)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run([
          message.id,
          message.sessionId,
          message.role,
          message.content,
          message.timestamp.toISOString(),
          message.metadata?.model || null,
          message.metadata?.tokens || null,
          message.metadata?.thinking ? 1 : 0,
          message.metadata?.agentType || null
        ], async (err) => {
          if (err) {
            reject(new Error(`Failed to add message: ${err.message}`));
            return;
          }

          // Insert tool calls if present
          if (message.toolCalls && message.toolCalls.length > 0) {
            try {
              await this.addToolCalls(message.id, message.toolCalls);
            } catch (error) {
              reject(error);
              return;
            }
          }

          resolve();
        });

        stmt.finalize();
      });
    });
  }

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC
      `, [sessionId], async (err, rows: any[]) => {
        if (err) {
          reject(new Error(`Failed to get messages: ${err.message}`));
          return;
        }

        try {
          const messages: ChatMessage[] = [];
          for (const row of rows) {
            const toolCalls = await this.getToolCalls(row.id);
            messages.push({
              id: row.id,
              sessionId: row.session_id,
              role: row.role as 'user' | 'assistant' | 'system',
              content: row.content,
              timestamp: new Date(row.timestamp),
              toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
              metadata: {
                model: row.model,
                tokens: row.tokens,
                thinking: row.thinking === 1,
                agentType: row.agent_type
              }
            });
          }
          resolve(messages);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  // Tool call methods
  private async addToolCalls(messageId: string, toolCalls: ToolCall[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO tool_calls (id, message_id, name, arguments, result, error, timestamp, duration, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      let completed = 0;
      const total = toolCalls.length;

      for (const toolCall of toolCalls) {
        stmt.run([
          toolCall.id,
          messageId,
          toolCall.name,
          JSON.stringify(toolCall.arguments),
          toolCall.result ? JSON.stringify(toolCall.result) : null,
          toolCall.error || null,
          toolCall.timestamp.toISOString(),
          toolCall.duration || null,
          toolCall.status
        ], (err) => {
          if (err) {
            reject(new Error(`Failed to add tool call: ${err.message}`));
            return;
          }

          completed++;
          if (completed === total) {
            stmt.finalize();
            resolve();
          }
        });
      }
    });
  }

  private async getToolCalls(messageId: string): Promise<ToolCall[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM tool_calls WHERE message_id = ? ORDER BY timestamp ASC
      `, [messageId], (err, rows: any[]) => {
        if (err) {
          reject(new Error(`Failed to get tool calls: ${err.message}`));
          return;
        }

        const toolCalls: ToolCall[] = rows.map(row => ({
          id: row.id,
          name: row.name,
          arguments: JSON.parse(row.arguments),
          result: row.result ? JSON.parse(row.result) : undefined,
          error: row.error,
          timestamp: new Date(row.timestamp),
          duration: row.duration,
          status: row.status as 'running' | 'success' | 'error'
        }));

        resolve(toolCalls);
      });
    });
  }

  async clearAllSessions(): Promise<void> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM sessions', (err) => {
        if (err) {
          reject(new Error(`Failed to clear sessions: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(new Error(`Failed to close database: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }
}

// Global database service instance
export const databaseService = new DatabaseService();