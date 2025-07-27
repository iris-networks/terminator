# Agent TARS Reborn

A modern recreation of the Agent TARS agentic chat interface, rebuilt from the ground up using Vercel AI SDK and contemporary web technologies. This project maintains the same user experience as the original while leveraging clean, modern APIs and architecture.

## 🚀 Features

### Frontend (Next.js + React)
- **Modern UI**: Clean, responsive interface matching the original Agent TARS design
- **Real-time Chat**: WebSocket-powered live conversations with streaming responses
- **Session Management**: Create, switch between, and manage multiple chat sessions
- **Markdown Support**: Rich text rendering with syntax highlighting for code blocks
- **Dark Mode Ready**: Tailwind CSS with dark mode support
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Animations**: Smooth transitions and micro-interactions using Framer Motion

### Backend (Express.js + Vercel AI SDK)
- **Multi-Provider AI**: Support for OpenAI and Anthropic models via Vercel AI SDK
- **Tool Calling**: Extensible system for web search, file operations, and command execution
- **Real-time Communication**: Socket.IO for live chat and streaming responses
- **RESTful API**: Complete REST endpoints for all chat and session operations
- **Session Persistence**: In-memory session storage (easily extensible to databases)
- **Type Safety**: Full TypeScript implementation throughout

### Agent Capabilities
- **Web Search**: Search the internet for current information
- **File Operations**: Read and write files with proper error handling
- **Command Execution**: Run system commands with output capture
- **Streaming Responses**: Real-time message delivery with thinking indicators
- **Context Awareness**: Maintains conversation context across interactions

## 🏗️ Architecture

This is a monorepo using pnpm workspaces with two main packages:

```
agent-tars-reborn/
├── frontend/          # Next.js React application
├── backend/           # Express.js API server
├── package.json       # Root workspace configuration
└── pnpm-workspace.yaml
```

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- OpenAI or Anthropic API key

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd agent-tars-reborn
   pnpm install
   ```

2. **Configure environment variables:**
   ```bash
   cd backend
   cp .env.example .env
   ```
   
   Edit `backend/.env` with your API keys:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   ```

3. **Start the development servers:**
   ```bash
   # From the root directory
   pnpm dev
   ```

   This starts both frontend (`:3000`) and backend (`:3001`) in parallel.

4. **Open your browser:**
   ```
   http://localhost:3000
   ```

## 📋 Available Scripts

### Root Level
- `pnpm dev` - Start both frontend and backend in development mode
- `pnpm build` - Build both applications for production
- `pnpm start` - Start the production backend server
- `pnpm clean` - Clean all build artifacts
- `pnpm lint` - Lint all packages
- `pnpm type-check` - Run TypeScript checks

### Frontend (`cd frontend`)
- `pnpm dev` - Start Next.js development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Backend (`cd backend`)
- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Compile TypeScript
- `pnpm start` - Start production server

## 🔧 Configuration

### AI Models
Configure the AI provider and model in `backend/.env`:

```env
AI_MODEL=gpt-4-turbo-preview        # or claude-3-sonnet-20240229
AI_PROVIDER=openai                  # or anthropic
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=4000
```

### Frontend Configuration
The frontend automatically connects to the backend. If running on different ports, update the socket connection in `frontend/src/lib/socket.ts`.

## 🛠️ Extending the System

### Adding Custom Tools

Create new tools for the AI to use by registering them in `backend/src/services/ToolRegistry.ts`:

```typescript
toolRegistry.registerTool({
  name: 'my_custom_tool',
  description: 'Description of what the tool does',
  parameters: {
    type: 'object',
    properties: {
      input: {
        type: 'string',
        description: 'Input parameter description',
      },
    },
    required: ['input'],
  },
  handler: async (args) => {
    // Your tool implementation
    return { result: 'Tool executed successfully' };
  },
});
```

### Database Integration

The current implementation uses in-memory storage. To add database persistence:

1. Choose your database (PostgreSQL, MongoDB, etc.)
2. Implement the storage interface in `backend/src/services/SessionService.ts`
3. Update the session and message models in `backend/src/types/index.ts`

### UI Customization

The frontend uses Tailwind CSS for styling. Key files to modify:

- `frontend/src/app/globals.css` - Global styles and CSS variables
- `frontend/tailwind.config.js` - Tailwind configuration
- Component files in `frontend/src/components/` - Individual UI components

## 🔒 Security Considerations

- **API Keys**: Never commit API keys to version control
- **Input Validation**: All user inputs are validated before processing
- **CORS**: Configured to only allow requests from the frontend domain
- **Tool Execution**: File and command tools should be sandboxed in production

## 🚀 Production Deployment

### Backend Deployment
1. Build the application: `pnpm build`
2. Set production environment variables
3. Use a process manager like PM2: `pm2 start dist/index.js`

### Frontend Deployment
1. Build the application: `pnpm build`
2. Deploy to Vercel, Netlify, or your preferred platform
3. Update the backend URL in the socket configuration

## 🤝 Contributing

This project recreates the Agent TARS experience with modern technologies. When contributing:

1. Maintain the original UI/UX patterns
2. Follow TypeScript best practices  
3. Add tests for new functionality
4. Update documentation for new features

## 📄 License

MIT License - feel free to use this code for your own projects.

## 🙏 Acknowledgments

- Original Agent TARS team for the inspiration and UI design
- Vercel AI SDK for the excellent AI integration APIs
- The open-source community for the amazing tools and libraries used

---

**Note**: This is a recreation of the Agent TARS interface using modern technologies. It maintains the same user experience while providing a clean, maintainable codebase for further development.