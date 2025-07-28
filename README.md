# Terminator

AI agent platform with Model Context Protocol integration, session persistence, and browser automation capabilities.

## Features

- **MCP Integration**: Dynamic tool discovery through Model Context Protocol
- **Session Persistence**: SQLite database for conversation and tool state management
- **Browser Automation**: Integrated browser control using @agent-infra/browser
- **Multi-AI Support**: Compatible with OpenAI and Anthropic models
- **Real-time Interface**: Next.js frontend with live agent interactions
- **Tool Registry**: Extensible system for adding custom agent capabilities

## Architecture

```
terminator/
├── frontend/          # Next.js web interface
├── backend/           # Express.js API server
├── package.json       # Workspace configuration
└── pnpm-workspace.yaml
```

## Setup

### Requirements
- Node.js 18+
- pnpm or npm
- OpenAI or Anthropic API key

### Installation

1. **Clone repository:**
   ```bash
   git clone [repository-url]
   cd terminator
   pnpm install
   ```

2. **Configure environment:**
   ```bash
   cd backend
   cp .env.example .env
   ```
   
   Edit `backend/.env`:
   ```env
   OPENAI_API_KEY=your_openai_key
   ANTHROPIC_API_KEY=your_anthropic_key
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   ```

3. **Start development:**
   ```bash
   pnpm dev
   ```

4. **Access interface:**
   ```
   http://localhost:3000
   ```

## Development Commands

### Workspace
- `pnpm dev` - Start both frontend and backend
- `pnpm build` - Build all projects
- `pnpm start` - Start production servers
- `pnpm clean` - Clean build artifacts
- `pnpm lint` - Lint all projects
- `pnpm type-check` - TypeScript validation

### Frontend (`cd frontend`)
- `pnpm dev` - Development server
- `pnpm build` - Production build
- `pnpm start` - Start production server

### Backend (`cd backend`)
- `pnpm dev` - Development server with hot reload
- `pnpm build` - Compile TypeScript
- `pnpm start` - Start production server

## Configuration

### AI Models
Configure in `backend/.env`:

```env
AI_MODEL=gpt-4-turbo-preview        # or claude-3-sonnet-20240229
AI_PROVIDER=openai                  # or anthropic
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=4000
```

## Extending the Platform

### Adding Tools

Register new tools in `backend/src/services/ToolRegistry.ts`:

```typescript
toolRegistry.register({
  name: 'custom_tool',
  description: 'Custom tool description',
  parameters: {
    type: 'object',
    properties: {
      input: {
        type: 'string',
        description: 'Tool input',
      },
    },
    required: ['input'],
  },
  handler: async (args) => {
    // Tool implementation
    return { result: 'Success' };
  },
});
```

### Session Persistence

Sessions are automatically stored in SQLite database. Access via `backend/src/services/SessionService.ts`.

### MCP Integration

MCP servers are configured and managed through the Model Context Protocol integration for dynamic tool discovery.

## License

MIT