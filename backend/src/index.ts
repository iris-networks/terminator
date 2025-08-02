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
import fs from 'fs';

// Load environment variables (development only)
dotenv.config();

// Validate required environment variables
const validateConfig = () => {
  const required = {
    'ANTHROPIC_API_KEY': process.env.ANTHROPIC_API_KEY,
    'AI_PROVIDER': process.env.AI_PROVIDER,
    'AI_MODEL': process.env.AI_MODEL
  };

  const missing = Object.entries(required)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   ${key}`));
    console.error('\nSet these environment variables and try again.');
    process.exit(1);
  }

  console.log('✅ Configuration validated');
  console.log(`   Provider: ${process.env.AI_PROVIDER}`);
  console.log(`   Model: ${process.env.AI_MODEL}`);
};

validateConfig();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Handle different paths for compiled binary vs development
const getPublicPath = () => {
  // Check if we're running as a compiled binary
  const isCompiled = __filename.includes('/$bunfs/');
  
  if (isCompiled) {
    // In compiled binary, look for public folder relative to binary location
    const binaryDir = path.dirname(process.argv[0]);
    const publicPath = path.join(binaryDir, 'public');
    
    // Also check current working directory
    if (!fs.existsSync(publicPath)) {
      return path.resolve(process.cwd(), 'public');
    }
    return path.resolve(publicPath);
  }
  
  // Development mode
  return path.resolve(__dirname, '../public');
};

const publicPath = getPublicPath();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || true, // Allow all origins for compiled binary
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 3000;

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
  origin: process.env.FRONTEND_URL || true, // Allow all origins for compiled binary
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend build
app.use(express.static(publicPath));
app.use('/_next/static', express.static(path.join(publicPath, '.next/static')));
app.use('/_next', express.static(path.join(publicPath, '.next')));

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
  const indexPath = path.resolve(publicPath, '.next/server/app/index.html');
  res.sendFile(indexPath, (err) => {
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
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || `http://localhost:${PORT}`}`);
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