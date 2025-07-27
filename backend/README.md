# Agent TARS Backend

Modern backend implementation for Agent TARS using Vercel AI SDK, built with Express.js and TypeScript.

## Features

- 🤖 **Multi-provider AI Support**: OpenAI and Anthropic integration via Vercel AI SDK
- 🛠️ **Tool Calling**: Extensible tool system for web search, file operations, and command execution
- 💬 **Real-time Chat**: WebSocket support with Socket.IO for live conversations
- 📱 **RESTful API**: Complete REST API for chat and session management
- 🔄 **Streaming**: Server-sent events for real-time AI response streaming
- 💾 **Session Management**: In-memory session storage with extensible architecture
- 🔧 **TypeScript**: Full type safety throughout the application

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- OpenAI or Anthropic API key

### Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

The server will start on `http://localhost:3001`.

## API Endpoints

### Chat Endpoints

- `POST /api/chat/message` - Send a message and get AI response
- `GET /api/chat/sessions/:sessionId/messages` - Get messages for a session
- `POST /api/chat/sessions/:sessionId/clear` - Clear session messages
- `GET /api/chat/config` - Get current AI configuration
- `POST /api/chat/config` - Update AI configuration

### Session Endpoints

- `GET /api/sessions` - Get all sessions
- `POST /api/sessions` - Create a new session
- `GET /api/sessions/:sessionId` - Get a specific session
- `PUT /api/sessions/:sessionId` - Update a session
- `DELETE /api/sessions/:sessionId` - Delete a session
- `GET /api/sessions/:sessionId/stats` - Get session statistics

### System Endpoints

- `GET /health` - Health check endpoint

## WebSocket Events

### Client to Server

- `join_session` - Join a session room
- `leave_session` - Leave a session room  
- `send_message` - Send a chat message
- `create_session` - Create a new session
- `get_sessions` - Get all sessions
- `delete_session` - Delete a session

### Server to Client

- `session_messages` - Existing messages when joining a session
- `new_message` - New message added to session
- `assistant_thinking` - AI thinking indicator
- `message_chunk` - Streaming message chunk
- `message_complete` - Complete message with metadata
- `session_created` - New session created
- `sessions_list` - List of all sessions
- `session_deleted` - Session deleted
- `error` - Error message

## Tool System

The backend includes an extensible tool system that allows the AI to perform actions:

### Built-in Tools

- **web_search**: Real web search using DuckDuckGo API with fallback to web scraping
- **file_read**: Secure file reading with workspace sandboxing and size limits
- **file_write**: Safe file writing with automatic backups and directory creation
- **list_files**: Directory listing with recursive options and file metadata
- **create_directory**: Directory creation with recursive parent creation
- **execute_command**: Secure command execution with timeout, shell selection, and dangerous command blocking
- **browser_action**: Full browser automation with Puppeteer for navigation, interaction, content extraction, and screenshots

### Adding Custom Tools

```typescript
import { toolRegistry } from './services/ToolRegistry.js';

toolRegistry.registerTool({
  name: 'custom_tool',
  description: 'Description of what the tool does',
  parameters: {
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: 'Parameter description',
      },
    },
    required: ['param1'],
  },
  handler: async (args) => {
    // Tool implementation
    return { result: 'success' };
  },
});
```

## Configuration

The AI service can be configured via environment variables:

- `AI_MODEL`: Model to use (default: gpt-4-turbo-preview)
- `AI_PROVIDER`: Provider to use (openai or anthropic)
- `AI_TEMPERATURE`: Temperature setting (0-1)
- `AI_MAX_TOKENS`: Maximum tokens per response

## Development

### Project Structure

```
src/
├── routes/          # Express route handlers
├── services/        # Business logic services
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── index.ts         # Application entry point
```

### Key Services

- **AIService**: Handles AI provider interactions via Vercel AI SDK
- **SessionService**: Manages chat sessions and messages
- **ToolRegistry**: Manages available tools for AI use
- **SocketService**: Handles WebSocket connections and events

### Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm type-check` - Run TypeScript type checking

## Production Deployment

1. Build the application:
   ```bash
   pnpm build
   ```

2. Set production environment variables
3. Start the server:
   ```bash
   pnpm start
   ```

## Contributing

This implementation focuses on recreating the Agent TARS experience with modern technologies. The architecture is designed to be extensible and maintainable.

## License

MIT