import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { chatRouter } from './routes/chat.js';
import { sessionRouter } from './routes/sessions.js';
import createReplayRouter from './routes/replay.js';
import { SocketService } from './services/SocketService.js';
import { errorHandler } from './utils/errorHandler.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || process.env.NODE_ENV === 'production' ? true : 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "'unsafe-eval'",
        "https://vercel.live"
      ],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'",
        "https://fonts.googleapis.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      imgSrc: [
        "'self'", 
        "data:", 
        "https:"
      ],
      connectSrc: [
        "'self'",
        "ws://localhost:3001",
        "wss://localhost:3001",
        "http://localhost:3001",
        "https://api.openai.com",
        "https://api.anthropic.com"
      ],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"]
    }
  }
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || process.env.NODE_ENV === 'production' ? true : 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../public')));
app.use('/_next/static', express.static(path.join(__dirname, '../public/.next/static')));
app.use('/_next', express.static(path.join(__dirname, '../public/.next')));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Socket.IO service
const socketService = new SocketService(io);
socketService.initialize();

// API Routes
app.use('/api/chat', chatRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/replay', createReplayRouter(socketService));

// Export socketService for use in routes
export { socketService };

// Error handling
app.use(errorHandler);

// Serve Next.js frontend for all non-API routes
app.get('*', (req, res) => {
  // Skip API routes and static assets
  if (req.path.startsWith('/api/') || req.path.startsWith('/health') || req.path.startsWith('/_next/')) {
    return res.status(404).json({ 
      error: 'Not Found', 
      message: `Route ${req.originalUrl} not found` 
    });
  }
  
  // Serve index.html for all other routes (SPA routing)
  res.sendFile(path.join(__dirname, '../public/.next/server/app/index.html'), (err) => {
    if (err) {
      res.status(404).json({ 
        error: 'Frontend not found', 
        message: 'Make sure to run the build script first' 
      });
    }
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Iris Backend running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n🛑 Shutting down gracefully...');
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down...');
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});