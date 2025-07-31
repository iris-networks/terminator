# Terminator

Multi-agent AI platform for code execution, research, and browser automation.

![Demo](./demo.gif)

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
pnpm dev
```

Open http://localhost:3000

## Development

```bash
pnpm dev        # Start dev servers
pnpm build      # Build for production
pnpm lint       # Lint code
pnpm type-check # TypeScript validation
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