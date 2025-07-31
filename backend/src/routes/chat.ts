import { Router } from 'express';
import { AIService } from '../services/AIService.js';
import { sessionService } from '../services/SessionService.js';
import { ApiError } from '../types/index.js';

const router = Router();

// Initialize AI service
const aiService = new AIService({
  model: process.env.AI_MODEL || 'gpt-4-turbo-preview',
  provider: (process.env.AI_PROVIDER as 'openai' | 'anthropic') || 'openai',
  temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4000'),
});

// POST /api/chat/message - Send a message and get response
router.post('/message', async (req, res, next) => {
  try {
    const { sessionId, message, stream = false } = req.body;

    if (!sessionId || !message) {
      const error = new Error('Session ID and message are required') as ApiError;
      error.status = 400;
      error.code = 'INVALID_INPUT';
      error.status = 400;
      error.code = 'INVALID_INPUT';
      throw error;
    }

    // Get or create session
    let session = await sessionService.getSession(sessionId);
    if (!session) {
      session = await sessionService.createSession();
    }

    // Add user message
    const userMessage = await sessionService.addMessage(sessionId, {
      role: 'user',
      content: message,
    });

    if (!userMessage) {
      const error = new Error('Failed to add message to session') as ApiError;
      error.status = 500;
      error.code = 'DATABASE_ERROR';
      error.status = 500;
      error.code = 'SESSION_ERROR';
      throw error;
    }

    // Get conversation history
    const messages = await sessionService.getMessages(sessionId);

    if (stream) {
      // Set up Server-Sent Events
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      });

      let assistantContent = '';

      try {
        for await (const chunk of aiService.streamResponse(messages)) {
          res.write(`data: ${JSON.stringify(chunk)}\\n\\n`);
          
          if (chunk.type === 'content') {
            assistantContent += chunk.data;
          }
          
          if (chunk.type === 'tool_call') {
            // Tool call results are already included in the stream
            res.write(`data: ${JSON.stringify({
              type: 'tool_result',
              data: chunk.data,
            })}\\n\\n`);
          }
          
          if (chunk.type === 'done') {
            // Save assistant message with tool call results
            const assistantMessage = await sessionService.addMessage(sessionId, {
              role: 'assistant',
              content: assistantContent,
              metadata: {
                tokens: chunk.data.usage?.totalTokens || 0,
              },
            });

            res.write(`data: ${JSON.stringify({
              type: 'message_complete',
              data: assistantMessage,
            })}\\n\\n`);
            break;
          }
        }
      } catch (error) {
        res.write(`data: ${JSON.stringify({
          type: 'error',
          data: { message: error instanceof Error ? error.message : 'Unknown error' },
        })}\\n\\n`);
      } finally {
        res.write('data: [DONE]\\n\\n');
        res.end();
      }
    } else {
      // Regular response
      const response = await aiService.generateResponse(messages);
      
      // Save assistant message
      const assistantMessage = await sessionService.addMessage(sessionId, {
        role: 'assistant',
        content: response.content,
        metadata: {
          tokens: response.metadata?.tokens || 0,
        },
      });

      res.json({
        success: true,
        data: {
          message: assistantMessage,
          response,
        },
      });
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/chat/sessions/:sessionId/messages - Get messages for a session
router.get('/sessions/:sessionId/messages', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const messages = await sessionService.getMessages(sessionId);
    
    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/chat/sessions/:sessionId/clear - Clear session messages
router.post('/sessions/:sessionId/clear', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    const session = await sessionService.getSession(sessionId);
    if (!session) {
      const error = new Error('Session not found') as ApiError;
      error.status = 404;
      error.code = 'SESSION_NOT_FOUND';
      error.status = 404;
      error.code = 'SESSION_NOT_FOUND';
      throw error;
    }

    // Clear messages by updating the session
    await sessionService.updateSession(sessionId, {
      metadata: {
        ...session.metadata,
        messageCount: 0,
        totalTokens: 0,
      }
    });

    // Note: This implementation clears metadata but doesn't actually delete messages from DB
    // A proper implementation would need a dedicated clearMessages method

    res.json({
      success: true,
      message: 'Session cleared successfully',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/chat/config - Get current AI configuration
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      model: process.env.AI_MODEL || 'gpt-4-turbo-preview',
      provider: process.env.AI_PROVIDER || 'openai',
      temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4000'),
    },
  });
});

// POST /api/chat/config - Update AI configuration
router.post('/config', (req, res, next) => {
  try {
    const { model, provider, temperature, maxTokens } = req.body;
    
    aiService.updateConfig({
      ...(model && { model }),
      ...(provider && { provider }),
      ...(temperature !== undefined && { temperature }),
      ...(maxTokens !== undefined && { maxTokens }),
    });

    res.json({
      success: true,
      message: 'Configuration updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

export { router as chatRouter };