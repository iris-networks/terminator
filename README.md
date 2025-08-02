<div align="center">
  <a href="https://github.com/iris-networks/terminator">
    <img src="https://raw.githubusercontent.com/hivelogic-dev/terminator/main/frontend/src/app/icon.svg" alt="Iris Logo" width="100" height="100">
  </a>
  <h1 align="center">Iris</h1>
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
  </div>
</div>

## What is Iris?

Iris is a modern AI-powered research and automation platform with advanced web capabilities. It's designed to be a multi-agent AI platform for code execution, research, and browser automation with standalone binary deployment.

## Getting Started

The easiest way to get started with Iris is by using the provided Docker setup.

**1. Clone the repository:**

```bash
git clone https://github.com/iris-networks/terminator.git
cd terminator
```

**2. Set up your environment:**

Copy the example environment file and add your API keys.

```bash
cp .env.example .env
```

**3. Build and run with Docker:**

```bash
docker-compose up --build
```

Once the containers are running, you can access the Iris platform at [http://localhost:3000](http://localhost:3000).

## Features

- **Code Execution**: Sandboxed Node.js, Python, and Shell environments with real-time output streaming and automatic dependency management.
- **Research**: Structured multi-step research workflows with web search, source attribution, and comprehensive report generation.
- **Browser Automation**: Full page automation with Puppeteer, session recording and replay, and visual element interaction.
- **Multi-Agent System**: A multi-agent system with specialized capabilities and persistent session management.
- **Extensible Tool Registry**: An extensible tool registry to add new capabilities to the platform.

## Documentation

For more detailed information on how to use and configure Iris, please refer to the [documentation](./docs/README.md).

## Contributing

We welcome contributions from the community! Please read our [contributing guidelines](./CONTRIBUTING.md) to get started.

## License

Iris is licensed under the [MIT License](./LICENSE).
