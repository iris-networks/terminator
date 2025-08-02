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
import { Router, type Router as ExpressRouter } from 'express';
import { sessionService } from '../services/SessionService.js';
import { ApiError } from '../types/index.js';

const router: ExpressRouter = Router();

// GET /api/sessions - Get all sessions
router.get('/', async (req, res, next) => {
  try {
    const sessions = await sessionService.getAllSessions();
    
    res.json({
      success: true,
      data: sessions.map(session => ({
        id: session.id,
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        messageCount: session.messages.length,
        metadata: session.metadata,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/sessions - Create a new session
router.post('/', async (req, res, next) => {
  try {
    const { title } = req.body;
    const session = await sessionService.createSession(title);
    
    res.status(201).json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/sessions/:sessionId - Get a specific session
router.get('/:sessionId', async (req, res, next) => {
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
    
    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/sessions/:sessionId - Update a session
router.put('/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { title } = req.body;
    
    const updatedSession = await sessionService.updateSession(sessionId, { title });
    
    if (!updatedSession) {
      const error = new Error('Session not found') as ApiError;
      error.status = 404;
      error.code = 'SESSION_NOT_FOUND';
      error.status = 404;
      error.code = 'SESSION_NOT_FOUND';
      throw error;
    }
    
    res.json({
      success: true,
      data: updatedSession,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/sessions/:sessionId - Delete a session
router.delete('/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const deleted = await sessionService.deleteSession(sessionId);
    
    if (!deleted) {
      const error = new Error('Session not found') as ApiError;
      error.status = 404;
      error.code = 'SESSION_NOT_FOUND';
      error.status = 404;
      error.code = 'SESSION_NOT_FOUND';
      throw error;
    }
    
    res.json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/sessions/:sessionId/stats - Get session statistics
router.get('/:sessionId/stats', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const stats = await sessionService.getSessionStats(sessionId);
    
    if (!stats) {
      const error = new Error('Session not found') as ApiError;
      error.status = 404;
      error.code = 'SESSION_NOT_FOUND';
      error.status = 404;
      error.code = 'SESSION_NOT_FOUND';
      throw error;
    }
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/sessions/clear-all - Clear all sessions (development only)
router.post('/clear-all', async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is not available in production',
      });
    }
    
    await sessionService.clearAllSessions();
    
    res.json({
      success: true,
      message: 'All sessions cleared successfully',
    });
  } catch (error) {
    next(error);
  }
});

export { router as sessionRouter };