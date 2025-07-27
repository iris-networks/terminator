import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import { chatRouter } from './routes/chat.js';
import { sessionRouter } from './routes/sessions.js';
import { SocketService } from './services/SocketService.js';
import { errorHandler } from './utils/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend build
app.use(express.static('public'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/chat', chatRouter);
app.use('/api/sessions', sessionRouter);

// Socket.IO service
const socketService = new SocketService(io);
socketService.initialize();

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found', 
    message: `Route ${req.originalUrl} not found` 
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Agent TARS Backend running on port ${PORT}`);
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