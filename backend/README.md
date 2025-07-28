# Iris Backend

Modern backend implementation for Iris using Vercel AI SDK, built with Express.js and TypeScript.

## Features

- 🤖 **Multi-Agent Architecture**: Intelligent agent selection (Multi-Agent, CodeAct, DeepResearch)
- 🔧 **CodeAct Agent**: Secure code execution in sandboxed environments (Node.js, Python, Shell)
- 🔍 **DeepResearch Agent**: Plan-and-execute research methodology with comprehensive reports
- 🛠️ **Advanced Tool System**: Specialized tools for each agent with enhanced capabilities
- 💻 **Multi-provider AI Support**: OpenAI and Anthropic integration via Vercel AI SDK
- 💬 **Real-time Chat**: WebSocket support with Socket.IO for live conversations
- 🎨 **Enhanced UI Renderers**: Specialized renderers for code execution and research results
- 📱 **RESTful API**: Complete REST API for chat and session management
- 🔄 **Streaming**: Server-sent events for real-time AI response streaming
- 💾 **Session Management**: In-memory session storage with extensible architecture
- 🔒 **Security**: Sandboxed workspaces and security controls for code execution
- 🧠 **Persistent Memory**: CodeAct memory system for session state management
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
- **list_files**: Directory listing with recursive options and file metadata
- **create_directory**: Directory creation with recursive parent creation
- **execute_command**: Secure command execution with timeout, shell selection, and dangerous command blocking
- **browser_action**: Full browser automation with Puppeteer for navigation, interaction, content extraction, and screenshots

### Specialized Agents

#### CodeAct Agent
Secure code execution environment with multi-language support:
- **node_codeact**: Execute JavaScript/Node.js code with npm dependency management
- **python_codeact**: Execute Python code with pip package management
- **shell_codeact**: Execute shell scripts in sandboxed environment
- **codeact_memory**: Persistent memory for code execution sessions

#### DeepResearch Agent  
Advanced research agent with plan-and-execute methodology:
- **enhanced_search**: Advanced web search with domain filtering and query optimization
- **enhanced_visit_link**: Detailed content extraction from web pages with multiple modes
- **deep_dive**: Comprehensive topic research combining search and content analysis
- **research_plan**: Create and manage structured research plans with progress tracking
- **report_generator**: Generate comprehensive research reports with citations

## Multi-Agent Architecture

Iris implements an intelligent multi-agent system with automatic agent selection based on task requirements.

### Available Agents

#### 1. Multi-Agent (Default)
- **Purpose**: General-purpose assistant with access to all tools
- **Use Cases**: General questions, mixed workflows, multi-domain tasks
- **Tools**: All available tools (basic + specialized)

#### 2. CodeAct Agent  
- **Purpose**: Secure code execution in sandboxed environments
- **Specializations**: Programming, debugging, automation, scripting
- **Workspace**: `~/.codeact/` with isolated subdirectories
- **Security**: Path validation, dependency sanitization, execution timeouts
- **Memory**: Persistent state between code execution sessions

**Use Cases:**
- Execute JavaScript/Node.js code with npm dependencies
- Run Python scripts with pip package management
- Execute shell scripts in secure environment
- Multi-language programming assistance with memory persistence

#### 3. DeepResearch Agent
- **Purpose**: Comprehensive research with structured planning and reporting
- **Specializations**: Research, analysis, information gathering, report generation
- **Methodology**: Plan-and-execute with 5-step research workflow
- **Features**: Multi-source synthesis, progress tracking, citation management

**Use Cases:**
- Comprehensive topic research with structured planning
- Multi-source information gathering and synthesis
- Generate detailed research reports with citations
- Enhanced web search with domain filtering and content analysis

### Agent Selection

Agents are automatically selected based on task keywords:

```typescript
// Code execution keywords → CodeAct Agent
const codeKeywords = ['code', 'execute', 'run', 'script', 'program', 'debug', 'javascript', 'python', 'node', 'npm', 'pip'];

// Research keywords → DeepResearch Agent  
const researchKeywords = ['research', 'study', 'analyze', 'investigate', 'report', 'information', 'analysis', 'comprehensive'];

// Default → Multi-Agent
```

### Manual Agent Selection

You can explicitly select an agent using the agent selection tools:

```typescript
// Select specific agent
await selectAgentTool.execute({
  task: "Execute Python code to analyze data",
  preferredAgent: "codeact"
});

// List available agents
await listAgentsTool.execute({
  includeTools: true
});

// Switch agents mid-conversation
await switchAgentTool.execute({
  newAgentType: "deep_research",
  reason: "Need comprehensive research capabilities"
});
```

## Enhanced UI Renderers

The frontend includes specialized renderers for different tool types:

### CodeActRenderer
- **Languages**: Node.js 🟨, Python 🐍, Shell 🔧
- **Features**: Syntax highlighting, terminal-like output, execution metadata
- **Display**: Code blocks, stdout/stderr separation, execution time, memory tracking

### DeepResearchRenderer  
- **Views**: Multi-tab interface (Overview, Sources, Insights)
- **Features**: Search results with relevance scoring, research plan visualization
- **Display**: Progress tracking, comprehensive reports, source attribution

### Tool Result Processing
Enhanced tool result detection in `AIService.ts`:

```typescript
// CodeAct tools
if (['node_codeact', 'python_codeact', 'shell_codeact'].includes(result.toolName)) {
  contentPart.type = result.toolName;
  // Extract code, output, error, duration, workspace, etc.
}

// DeepResearch tools  
else if (['enhanced_search', 'deep_dive', 'research_plan'].includes(result.toolName)) {
  contentPart.type = result.toolName;
  // Extract query, sources, insights, plan, report, etc.
}
```

## Workspace Management

### CodeAct Workspaces
```
~/.codeact/
├── .code_act_memory.json    # Persistent memory storage
├── node/                    # Node.js workspace
│   ├── package.json
│   └── node_modules/
├── python/                  # Python workspace
│   └── site-packages/
└── shell/                   # Shell workspace
```

### Security Features
- **Path Validation**: Prevents directory traversal attacks
- **Dependency Validation**: Regex-based package name sanitization  
- **Execution Timeout**: 30-second timeout prevents infinite loops
- **Sandboxed Environments**: Isolated workspaces per language
- **Command Filtering**: Dangerous commands blocked (rm -rf /, dd if=, etc.)

## Environment Configuration

### Required Environment Variables
```env
# AI Provider Configuration
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:3000

# CodeAct Configuration (Optional)
CODEACT_WORKSPACE=/path/to/custom/workspace  # Default: ~/.codeact

# AI Model Configuration (Optional)
AI_MODEL=gpt-4-turbo-preview
AI_PROVIDER=openai
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=4000
```

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
├── agents/                      # Multi-agent system
│   ├── AgentTARS.ts            # Agent orchestration and selection
│   ├── CodeActAgent.ts         # Code execution agent
│   └── DeepResearchAgent.ts    # Research agent
├── routes/                     # Express route handlers
│   ├── chat.ts                # Chat API endpoints
│   └── sessions.ts            # Session management
├── services/                   # Business logic services
│   ├── AIService.ts           # AI provider interactions
│   ├── SessionService.ts      # Session management
│   ├── SocketService.ts       # WebSocket handling
│   ├── BrowserManager.ts      # Browser automation
│   ├── ToolRegistry.ts        # Tool management (legacy)
│   ├── MCPToolRegistry.ts     # MCP integration
│   └── tools/                 # Modular tool system
│       ├── categories/        # Tool categories
│       │   ├── web-search.ts
│       │   ├── file-system.ts
│       │   ├── command-execution.ts
│       │   ├── browser-automation.ts
│       │   └── browser-tabs.ts
│       ├── core/              # Core utilities
│       │   ├── constants.ts
│       │   ├── security.ts
│       │   └── types.ts
│       ├── mcp/               # MCP integration
│       └── index.ts           # Tool registry
├── types/                     # TypeScript definitions
│   ├── index.ts              # Main types
│   └── mcp.ts                # MCP types
├── utils/                     # Utility functions
└── index.ts                   # Application entry point
```

### Key Services

- **AIService**: Enhanced AI provider interactions with tool result processing
- **SessionService**: Manages chat sessions and messages with agent context
- **SocketService**: Handles WebSocket connections and real-time tool results
- **BrowserManager**: Advanced browser automation with recovery mechanisms
- **AgentTARS**: Multi-agent orchestration with intelligent selection
- **CodeActAgent**: Secure code execution with memory and workspace management
- **DeepResearchAgent**: Research planning and execution with report generation

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

## Usage Examples

### Code Execution with CodeAct Agent
```typescript
// Automatic agent selection for code tasks
const response = await generateResponse([
  { role: 'user', content: 'Execute Python code to calculate fibonacci sequence' }
]);

// Manual CodeAct tool usage
await nodeCodeActTool.execute({
  code: 'console.log("Hello from Node.js!");',
  installDependencies: 'lodash,axios',
  memoryKey: 'hello_world',
  saveToFile: 'hello.js'
});
```

### Research with DeepResearch Agent  
```typescript
// Automatic agent selection for research tasks
const response = await generateResponse([
  { role: 'user', content: 'Research comprehensive information about quantum computing applications' }
]);

// Manual research workflow
const plan = await researchPlanTool.execute({
  action: 'create',
  sessionId: 'research_session_1',
  query: 'Quantum computing applications in cryptography'
});

const deepDive = await deepDiveTool.execute({
  topic: 'Quantum cryptography',
  focusAreas: ['RSA encryption', 'post-quantum algorithms'],
  sessionId: 'research_session_1'
});
```

## Contributing

This implementation provides a comprehensive multi-agent system based on the UI-TARS architecture, adapted for the Iris platform. The system is designed to be:

- **Extensible**: Easy to add new agents and tools
- **Secure**: Sandboxed execution environments with proper validation
- **Scalable**: Modular architecture supporting complex workflows
- **User-Friendly**: Rich UI renderers for enhanced user experience

### Adding New Agents

1. Create agent implementation in `src/agents/`
2. Add agent type to `AgentType` enum
3. Update agent capabilities in `AGENT_CAPABILITIES`
4. Implement specialized tools
5. Create corresponding UI renderers
6. Update tool result processing in `AIService.ts`

## License

MIT