# Iris - Advanced AI Agent Platform

Sophisticated multi-agent system with specialized agents for code execution, comprehensive research, and browser automation, featuring secure sandboxed environments and intelligent task routing.

## 🎬 Demo

![Iris Demo](./demo.gif)

*Watch Iris in action: Multi-agent code execution, research workflows, and browser automation in a modern AI interface*

## 🚀 Key Features

### **Multi-Agent Architecture**
- 🤖 **Intelligent Agent Selection**: Automatic routing based on task requirements
- 🔧 **CodeAct Agent**: Secure code execution in sandboxed environments (Node.js, Python, Shell)
- 🔍 **DeepResearch Agent**: Plan-and-execute research methodology with comprehensive reports
- 🎯 **Multi-Agent**: General-purpose assistant with access to all capabilities

### **Advanced Code Execution**
- 💻 **Multi-Language Support**: JavaScript/Node.js, Python, Shell with dependency management
- 🔒 **Sandboxed Security**: Isolated workspaces with path validation and timeout protection
- 🧠 **Persistent Memory**: Session state management across code executions
- 📦 **Dependency Management**: Automatic npm/pip package installation with validation

### **Comprehensive Research**
- 📊 **Structured Planning**: 5-step research workflow with progress tracking
- 🔍 **Enhanced Search**: Advanced web search with domain filtering and query optimization
- 📄 **Report Generation**: Comprehensive reports with citations and source attribution
- 🎨 **Rich Visualizations**: Multi-tab interface with relevance scoring and insights

### **Enhanced User Experience**
- 🎨 **Specialized Renderers**: Beautiful UI for code execution and research results
- ⚡ **Real-time Streaming**: Live updates for tool execution and research progress
- 🔄 **Session Management**: Persistent conversations with agent context
- 📱 **Responsive Design**: Modern Next.js interface with dark mode support

### **Browser Automation & Web Tools**
- 🌐 **Advanced Browser Control**: Full page automation with Puppeteer integration
- 🔄 **Session Replay**: Record and playback user interactions for debugging
- 📊 **Data Extraction**: Intelligent content extraction from web pages
- 🎯 **Element Interactions**: Click, drag, hover, form filling with visual feedback
- 🔍 **Enhanced Web Search**: Multi-engine search with domain filtering

### **Enterprise Features**
- 🔗 **MCP Integration**: Dynamic tool discovery through Model Context Protocol
- 🗄️ **Session Persistence**: SQLite database for conversation and tool state management
- 🌐 **Browser Automation**: Advanced browser control with recovery mechanisms
- 🔌 **Multi-AI Support**: Compatible with OpenAI and Anthropic models
- 🛠️ **Extensible Architecture**: Easy to add new agents, tools, and capabilities

## 🧠 Agent Capabilities

### **CodeAct Agent** 🔧
Specialized for secure code execution with enterprise-grade security:

**Languages Supported:**
- **Node.js/JavaScript** 🟨 - npm dependency management, ESM/CommonJS support
- **Python** 🐍 - pip package installation, isolated site-packages
- **Shell/Bash** 🔧 - secure script execution with command filtering

**Key Features:**
- Sandboxed workspace (`~/.codeact/`) with isolated environments
- Real-time output streaming with syntax highlighting
- Persistent memory system for session state
- Automatic dependency installation with security validation
- 30-second execution timeout with graceful termination

### **DeepResearch Agent** 🔍
Advanced research capabilities with structured methodology:

**Research Workflow:**
1. **Topic Analysis** - Extract main topics, subtopics, and keywords
2. **Plan Generation** - Create 3-6 strategic research steps
3. **Information Gathering** - Multi-source content collection
4. **Analysis & Synthesis** - Organize findings by relevance
5. **Report Generation** - Comprehensive reports with citations

**Key Features:**
- Enhanced web search with domain filtering
- Content extraction with multiple modes (full, summary, structured)
- Progress tracking with session management
- Multi-format report generation (Markdown, HTML, Text)
- Source attribution and relevance scoring

### **Multi-Agent** 🎯
General-purpose assistant with access to all capabilities:
- Combines all specialized tools in one interface
- Intelligent routing to specialized agents when needed
- Perfect for mixed workflows and general assistance

### **Browser Automation Tools** 🌐
Advanced web automation capabilities with visual renderers:

**Browser Actions:**
- **Navigation** - URL navigation with wait conditions and error handling
- **Element Interactions** - Click, drag, hover, scroll with coordinate precision
- **Form Automation** - Input filling, selection, and submission
- **Data Extraction** - Structured content extraction with multiple modes
- **Tab Management** - Multi-tab workflows with session persistence

**Key Features:**
- Visual feedback with coordinate highlighting
- Session replay for debugging automation workflows
- Content extraction with intelligent parsing
- Recovery mechanisms for failed operations
- Real-time streaming of browser actions

## 🏗️ Architecture

```
iris/
├── frontend/                    # Next.js web interface
│   ├── src/components/tools/    # Specialized renderers
│   │   └── renderers/          # CodeAct, DeepResearch & Browser UI
│   │       ├── browser/        # Browser action renderers
│   │       ├── CodeActRenderer.tsx
│   │       ├── DeepResearchRenderer.tsx
│   │       └── BrowserControlRenderer.tsx
│   └── src/components/workspace/ # Session replay & playback
├── backend/                     # Express.js API server
│   ├── src/agents/             # Multi-agent system
│   │   ├── AgentTARS.ts        # Agent orchestration
│   │   ├── CodeActAgent.ts     # Code execution
│   │   └── DeepResearchAgent.ts # Research planning
│   ├── src/services/           # Core services
│   │   ├── BrowserManager.ts   # Browser automation
│   │   ├── SessionService.ts   # Session replay
│   │   └── tools/             # Tool registry
│   │       ├── browser/       # Browser automation tools
│   │       ├── categories/    # Organized tool categories
│   │       └── mcp/          # MCP integration
│   └── workspace/             # Sandboxed execution environment
├── package.json               # Workspace configuration
└── pnpm-workspace.yaml
```

## Setup

### Requirements
- Node.js 22+
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
   # AI Provider Configuration
   OPENAI_API_KEY=your_openai_key
   ANTHROPIC_API_KEY=your_anthropic_key
   
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

## 💡 Usage Examples

### **Code Execution with CodeAct**
```bash
# User: "Execute Python code to calculate fibonacci sequence"
# → Automatically selects CodeAct Agent
# → Runs in sandboxed Python environment  
# → Displays results with syntax highlighting and execution metrics
# → Persists session state for continued development
```

### **Research with DeepResearch**
```bash
# User: "Research comprehensive information about quantum computing"
# → Automatically selects DeepResearch Agent
# → Creates structured 5-step research plan
# → Gathers information from multiple sources with progress tracking
# → Generates comprehensive report with citations and relevance scoring
```

### **Browser Automation**
```bash
# User: "Navigate to example.com and extract the main heading"
# → Launches browser automation
# → Visual feedback with coordinate highlighting
# → Extracts structured data with intelligent parsing
# → Session replay capability for debugging
```

### **Agent Selection**
```bash
# Automatic selection based on keywords:
"run python script" → CodeAct Agent 🔧
"research topic" → DeepResearch Agent 🔍  
"automate browser" → Browser Tools 🌐
"general question" → Multi-Agent 🎯

# Manual selection via UI or API
```

## 🔧 Extending the Platform

### **Adding New Agents**

1. Create agent in `backend/src/agents/YourAgent.ts`
2. Add agent type to `AgentType` enum  
3. Update `AGENT_CAPABILITIES` configuration
4. Implement specialized tools
5. Create UI renderer in `frontend/src/components/tools/renderers/`
6. Update tool processing in `AIService.ts`

### **Adding Custom Tools**

Register tools in the modular system:

```typescript
// backend/src/services/tools/categories/your-category.ts
export const yourCustomTool = tool({
  description: 'Your custom tool description',
  parameters: z.object({
    input: z.string().describe('Tool input'),
  }),
  execute: async ({ input }) => {
    // Tool implementation
    return { result: 'Success', data: input };
  },
});
```

### **Creating Custom Renderers**

Add specialized UI for your tools:

```typescript
// frontend/src/components/tools/renderers/YourRenderer.tsx
export const YourRenderer: React.FC<RendererProps> = ({ part }) => {
  return (
    <div className="your-custom-renderer">
      {/* Custom UI for your tool results */}
    </div>
  );
};
```

## 🌟 Key Advantages

### **Compared to Basic AI Assistants:**
- ✅ **Specialized Agents** for domain-specific tasks vs generic responses
- ✅ **Secure Code Execution** in sandboxed environments vs text-only responses
- ✅ **Structured Research** with planning and citations vs simple search
- ✅ **Persistent Memory** across sessions vs stateless interactions
- ✅ **Beautiful UI Renderers** for rich visualizations vs plain text

### **Enterprise Ready:**
- 🔒 **Security First**: Sandboxed execution with validation and timeouts
- 📊 **Session Management**: SQLite persistence with conversation history
- 🔌 **Extensible**: MCP integration for dynamic tool discovery
- 🎨 **Professional UI**: Modern interface with specialized renderers
- 🚀 **Scalable**: Modular architecture for easy expansion

### **Based on UI-TARS Architecture:**
This implementation provides the same sophisticated agent capabilities as the ByteDance UI-TARS system, adapted for modern deployment with enhanced security, browser automation, and session replay capabilities.

## 📚 Documentation

- **Backend API**: Detailed documentation in `backend/README.md`
- **Agent Architecture**: Multi-agent system with specialized capabilities
- **Security Model**: Sandboxed execution and validation mechanisms
- **Extension Guide**: How to add new agents, tools, and renderers

## 🤝 Contributing

We welcome contributions! This platform is designed to be:
- **Extensible**: Easy to add new agents and capabilities
- **Secure**: Enterprise-grade security for code execution
- **User-Friendly**: Rich UI with specialized renderers
- **Modern**: Built with latest TypeScript, React, and AI technologies

## 📄 License

MIT - See LICENSE file for details