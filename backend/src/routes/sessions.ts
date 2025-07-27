import { Router } from 'express';
import { sessionService } from '../services/SessionService.js';
import { ApiError } from '../types/index.js';

const router = Router();

// GET /api/sessions - Get all sessions
router.get('/', (req, res) => {
  const sessions = sessionService.getAllSessions();
  
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
});

// POST /api/sessions - Create a new session
router.post('/', (req, res) => {
  const { title } = req.body;
  const session = sessionService.createSession(title);
  
  res.status(201).json({
    success: true,
    data: session,
  });
});

// GET /api/sessions/:sessionId - Get a specific session
router.get('/:sessionId', (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = sessionService.getSession(sessionId);
    
    if (!session) {
      const error: ApiError = new Error('Session not found');
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
router.put('/:sessionId', (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { title } = req.body;
    
    const updatedSession = sessionService.updateSession(sessionId, { title });
    
    if (!updatedSession) {
      const error: ApiError = new Error('Session not found');
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
router.delete('/:sessionId', (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const deleted = sessionService.deleteSession(sessionId);
    
    if (!deleted) {
      const error: ApiError = new Error('Session not found');
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
router.get('/:sessionId/stats', (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const stats = sessionService.getSessionStats(sessionId);
    
    if (!stats) {
      const error: ApiError = new Error('Session not found');
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
router.post('/clear-all', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: 'This endpoint is not available in production',
    });
  }
  
  sessionService.clearAllSessions();
  
  res.json({
    success: true,
    message: 'All sessions cleared successfully',
  });
});

export { router as sessionRouter };