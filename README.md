# Iris AI Platform

**Important**: Sessions are not auto-created. Don't forget to click the blue plus icon to create a new session!

Multi-agent AI platform for code execution, research, and browser automation with standalone binary deployment.

![Demo](./demo.gif)

## 🚀 Quick Start with Docker

The easiest way to run Iris is using Docker with a full desktop environment:

```bash
# 1. Set your API key
export ANTHROPIC_API_KEY=your-api-key-here

# 2. Build for Linux and start container
bun run build && bun run compile:linux
docker-compose up -d

# 3. Access the desktop environment
open http://localhost:3000
```

**Access Points:**
- 🖥️ **Desktop Environment**: http://localhost:3000 (username: `iris`, password: `iris123`)
- 🤖 **Iris AI Platform**: Double-click "Iris AI Platform" icon on desktop, then access http://localhost:3001

## 📦 Standalone Binary

Iris is compiled into a single binary with zero dependencies (except Chrome/Chromium):

```bash
# Build the binary
bun run compile

# Run with environment variables
ANTHROPIC_API_KEY=your-key \
AI_PROVIDER=anthropic \
AI_MODEL=claude-sonnet-4-20250514 \
./dist/iris-server
```

**Cross-platform binaries:**
```bash
bun run compile:linux    # Linux x64 binary
bun run compile:windows  # Windows x64 binary
```

## 🐳 Docker Deployment

### Architecture

The Docker setup uses **LinuxServer.io webtop** providing:
- ✅ **Full Ubuntu MATE Desktop** accessible via web browser
- ✅ **Chrome/Chromium** pre-installed for browser automation
- ✅ **NoVNC Web Interface** - no client software needed
- ✅ **Persistent Storage** for data and workspace
- ✅ **Manual Launch** - Desktop icon to start Iris when needed

### Configuration

**Environment Variables:**
```yaml
# Required
ANTHROPIC_API_KEY=your-api-key-here

# AI Configuration  
AI_PROVIDER=anthropic
AI_MODEL=claude-sonnet-4-20250514
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=4000

# Desktop Environment
CUSTOM_USER=iris
PASSWORD=iris123
TZ=Etc/UTC
```

**Ports:**
- `3000`: noVNC web desktop interface
- `3001`: Iris AI Platform

**Volumes:**
- `iris_data`: SQLite database and sessions
- `iris_workspace`: Code execution workspace  
- `iris_config`: Desktop configuration

### Production Deployment

**1. Server Deployment:**
```bash
# Clone and configure
git clone <repository>
cd terminator
export ANTHROPIC_API_KEY=your-key

# Build for Linux and deploy
bun run build && bun run compile:linux
docker-compose up -d

# Access via reverse proxy (recommended)
# Point your domain to http://localhost:3000
```

**2. Manual Binary Deployment:**
```bash
# Build for target platform
bun run compile:linux

# Copy binary to server
scp ./dist/iris-server-linux user@server:/opt/iris-server

# Run with systemd or supervisor
ANTHROPIC_API_KEY=key ./iris-server
```

## Features

**Code Execution**
- Sandboxed Node.js, Python, and Shell environments
- Real-time output streaming
- Automatic dependency management

**Research**
- Structured multi-step research workflows
- Web search with source attribution
- Comprehensive report generation

**Browser Automation**
- Full page automation with Puppeteer
- Session recording and replay
- Visual element interaction

**Architecture**
- Multi-agent system with specialized capabilities
- Persistent session management
- Extensible tool registry

## Setup

```bash
git clone [repository-url]
cd terminator
pnpm install

# Configure environment
cd backend
cp .env.example .env
# Add your OpenAI/Anthropic API key

# Start development
pnpm run dev:watch
```

Open http://localhost:3000

## Development

```bash
pnpm run dev:watch # Start dev servers
pnpm build         # Build for production
pnpm lint          # Lint code
pnpm type-check    # TypeScript validation

# Secure server startup (API key not visible in process list)
API_KEY=your_key ./start-server.sh
```

## Deployment

For production deployment with secure environment variables:

```bash
# Pass environment variables inline (recommended for servers)
VAR1=value1 VAR2=value2 pnpm prod
VAR1=value1 VAR2=value2 pnpm start

# Variables are passed directly to the process without appearing in ps output
```

## Architecture

```
terminator/
├── frontend/           # Next.js interface
├── backend/            # Express API
│   ├── src/agents/     # Multi-agent system
│   ├── src/services/   # Core services
│   └── workspace/      # Sandboxed execution
└── package.json        # Workspace config
```

## Roadmap

<details>
<summary><strong>🔍 Enhanced Browser & Vision</strong> - Smart automation with visual understanding</summary>

- [ ] **Vision-enabled browser operator** - AI can see and understand web pages like humans
- [ ] **Full computer automation** - Control desktop apps, not just browsers  
- [ ] **LightPanda browser engine** - 10x faster than Chrome for automation
- [ ] **Cross-platform desktop apps** - Native apps for Mac, Linux, Windows

</details>

<details>
<summary><strong>⚡ Workflow Automation</strong> - Build once, run everywhere</summary>

- [ ] **Workflow templates** - Save and reuse complex automation sequences
- [ ] **Task scheduler** - Run workflows on schedules or triggers
- [ ] **Cron job integration** - Standard Unix scheduling support
- [ ] **CLI & headless mode** - Run without GUI for servers

</details>

<details>
<summary><strong>🏢 Enterprise & Teams</strong> - Scale to organizations</summary>

- [ ] **Cloud workflow storage** - Upload and share automation reports
- [ ] **PostgreSQL backend** - Team collaboration and data persistence
- [ ] **MCP protocol v2** - Next-gen tool discovery and integration
- [ ] **Multi-tenant support** - Isolated workspaces for teams

</details>

<details>
<summary><strong>🤖 AI & Model Support</strong> - Run any AI, anywhere</summary>

- [ ] **Hundreds of local agents** - Swarm intelligence on consumer hardware
- [ ] **Open-source model support** - Llama, Mistral, CodeLlama, etc.
- [ ] **Qdrant vector database** - Unlimited tool and knowledge integration
- [ ] **Smart context management** - Efficient memory and token usage

</details>

<details>
<summary><strong>🛠️ Infrastructure</strong> - Production-ready deployment</summary>

- [ ] **Distributed agents** - Scale across multiple machines
- [ ] **Advanced security** - Role-based access, audit logs
- [ ] **Monitoring & metrics** - Performance tracking and analytics
- [ ] **Container orchestration** - Docker/K8s deployment support

</details>

> **Want to contribute?** Check our [Issues](../../issues) or start a [Discussion](../../discussions) to help shape these features.

## Contributing

We welcome contributions from the community! Here's how you can help:

### Quick Start
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Submit a pull request with a clear description

### Areas We Need Help
- **🐛 Bug Reports** - Found an issue? [Report it](../../issues/new?template=bug_report.md)
- **💡 Feature Requests** - Have an idea? [Share it](../../issues/new?template=feature_request.md)
- **📝 Documentation** - Help improve our docs and examples
- **🧪 Testing** - Write tests, test on different platforms
- **🎨 UI/UX** - Improve the interface and user experience

### Development Guidelines
- Follow existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Keep commits atomic and well-described

### Community
- **Discord**: [Join our community](https://discord.gg/your-link)
- **Discussions**: [GitHub Discussions](../../discussions)
- **Issues**: [Report bugs or request features](../../issues)

## License

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

---

**Built with ❤️ by Hivelogic - Iris v2**