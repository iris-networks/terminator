<div align="center">
  <a href="https://github.com/iris-networks/terminator">
    <img src="https://raw.githubusercontent.com/hivelogic-dev/terminator/main/terminator.png" alt="Terminator Logo" width="100" height="100">
  </a>
  <h1 align="center">Terminator</h1>
  <p align="center">
    The AI-powered research and automation platform.
  </p>
  <div align="center">
    <a href="https://github.com/iris-networks/terminator/blob/main/LICENSE">
      <img src="https://img.shields.io/github/license/iris-networks/terminator?style=flat-square" alt="License">
    </a>
    <a href="https://github.com/iris-networks/terminator/issues">
      <img src="https://img.shields.io/github/issues/iris-networks/terminator?style=flat-square" alt="Issues">
    </a>
    <a href="https://github.com/iris-networks/terminator/pulls">
      <img src="https://img.shields.io/github/issues-pr/iris-networks/terminator?style=flat-square" alt="Pull Requests">
    </a>
    <a href="https://www.typescriptlang.org/">
      <img src="https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg" alt="TypeScript">
    </a>
    <a href="https://nodejs.org/">
      <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js">
    </a>
    <a href="https://nextjs.org/">
      <img src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js">
    </a>
    <a href="https://react.dev/">
      <img src="https://img.shields.io/badge/react-%2320232a.svg?style=flat-square&logo=react&logoColor=%2361DAFB" alt="React">
    </a>
    <a href="https://tailwindcss.com/">
      <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
    </a>
    <a href="https://expressjs.com/">
      <img src="https://img.shields.io/badge/express.js-%23404d59.svg?style=flat-square&logo=express&logoColor=%2361DAFB" alt="Express.js">
    </a>
    <a href="https://socket.io/">
      <img src="https://img.shields.io/badge/Socket.io-010101?&style=flat-square&logo=Socket.io&logoColor=white" alt="Socket.IO">
    </a>
    <a href="https://pptr.dev/">
      <img src="https://img.shields.io/badge/Puppeteer-40B5A4?style=flat-square&logo=puppeteer&logoColor=white" alt="Puppeteer">
    </a>
    <a href="https://bun.sh/">
      <img src="https://img.shields.io/badge/Powered%20by-Bun-yellow.svg" alt="Powered by Bun">
    </a>
    <a href="https://pnpm.io/">
      <img src="https://img.shields.io/badge/pnpm-%234a4a4a.svg?style=flat-square&logo=pnpm&logoColor=f69220" alt="pnpm">
    </a>
    <a href="https://vercel.com/">
      <img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel">
    </a>
    <a href="https://openai.com/gpt-4">
      <img src="https://img.shields.io/badge/GPT--4-59A995?style=flat-square&logo=openai&logoColor=white" alt="GPT-4">
    </a>
    <a href="https://deepmind.google/technologies/gemini/">
      <img src="https://img.shields.io/badge/Gemini-4A89F3?style=flat-square&logo=google&logoColor=white" alt="Gemini">
    </a>
    <a href="https://www.anthropic.com/claude">
      <img src="https://img.shields.io/badge/Claude-D97A54?style=flat-square" alt="Claude">
    </a>
    <a href="https://discord.gg/uuNbJQyw6g">
      <img src="https://img.shields.io/discord/1262528773294067712?logo=discord&colorB=5865F2" alt="Discord">
    </a>
  </div>
</div>

## What is Terminator?

Terminator is a modern AI-powered research and automation platform with advanced web capabilities. It's designed to be a multi-agent AI platform for code execution, research, and browser automation with standalone binary deployment.

![Demo](demo.gif)

## Getting Started

The easiest way to get started with Terminator is by cloning the repository and running the watch command.

**1. Clone the repository:**

```bash
git clone https://github.com/iris-networks/terminator.git
cd terminator
```

**2. Install dependencies:**

```bash
bun install
```

**3. Set up your environment:**

Copy the example environment file and configure your AI provider:
```bash
cp .env.example .env
```

Edit the `.env` file with your API key:
```bash
AI_MODEL=claude-sonnet-4-20250514
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### Supported AI Providers

Terminator supports multiple AI providers including Anthropic, OpenAI, Google Gemini, Ollama, and OpenRouter. 

For detailed setup instructions for each provider, see the [AI Providers Documentation](./docs/AI_PROVIDERS.md).


**3. Install dependencies and run the app:**

**4. Start the application:**

```bash
bun dev:watch
```

Once running, you can access the Terminator platform at [http://localhost:3000](http://localhost:3000).

## Features

- **Code Execution**: Sandboxed Node.js, Python, and Shell environments with real-time output streaming and automatic dependency management.
- **Research**: Structured multi-step research workflows with web search, source attribution, and comprehensive report generation.
- **Browser Automation**: Full page automation with Puppeteer, session recording and replay, and visual element interaction.
- **Multi-Agent System**: A multi-agent system with specialized capabilities and persistent session management.
- **Extensible Tool Registry**: An extensible tool registry to add new capabilities to the platform.

## Documentation

For more detailed information on how to use and configure Terminator, please refer to the [documentation](./docs/README.md).

## Community

Join our community on [Discord](https://discord.gg/uuNbJQyw6g) to ask questions, share your projects, and connect with other developers.

## Contributing

We welcome contributions from the community! Please read our [contributing guidelines](./CONTRIBUTING.md) to get started.

## License

Terminator is licensed under the [Apache License 2.0](./LICENSE).
