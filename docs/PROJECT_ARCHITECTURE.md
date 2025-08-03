# Project Architecture

Terminator is a monorepo managed with `pnpm` workspaces. It consists of two main packages: a `frontend` application and a `backend` server.

## Directory Structure

```
.
├── backend/         # Node.js/Express backend
├── data/            # Local data, including the SQLite database
├── docs/            # Project documentation
├── frontend/        # Next.js/React frontend
├── node_modules/
├── package.json
└── pnpm-workspace.yaml
```

---

### Backend

The backend is a TypeScript-based Node.js application using Express.js for the API and Socket.IO for real-time communication.

-   **`src/`**: The main source code for the backend.
    -   **`agents/`**: Contains the logic for different AI agents (e.g., `CodeActAgent`, `DeepResearchAgent`). These agents are responsible for orchestrating tasks and using tools to achieve goals.
    -   **`config/`**: Handles application configuration.
    -   **`routes/`**: Defines the HTTP API endpoints for chat, sessions, and replays.
    -   **`services/`**: Core backend services.
        -   `AIService.ts`: Handles interactions with AI models (OpenAI, Anthropic, Google).
        -   `DatabaseService.ts`: Manages the SQLite database connection.
        -   `SocketService.ts`: Manages the WebSocket connection with the frontend.
        -   `ToolRegistry.ts`: Manages the available tools that agents can use.
    -   **`tools/`**: Implementation of the tools available to the agents, such as file system operations and command execution.
    -   **`types/`**: TypeScript type definitions.
    -   **`index.ts`**: The entry point for the backend server.
-   **`workspace/`**: A sandboxed directory where agents can perform file system operations.

---

### Frontend

The frontend is a Next.js application built with React and TypeScript, styled with Tailwind CSS.

-   **`src/`**: The main source code for the frontend.
    -   **`app/`**: The main application pages and layout, following the Next.js App Router structure.
    -   **`components/`**: Reusable React components.
        -   `chat/`: Components for the main chat interface.
        -   `sidebar/`: The application's sidebar component.
        -   `tools/`: Components for rendering the results of different tools used by the agents.
    -   **`contexts/`**: React contexts for managing global state (e.g., theme).
    -   **`hooks/`**: Custom React hooks for managing chat state (`useChat.ts`) and WebSocket connections (`useSocket.ts`).
    -   **`lib/`**: Utility functions and libraries, including the client-side socket setup.

---

### Root

The root directory contains configuration files for the entire project.

-   **`bun.lock` / `pnpm-workspace.yaml`**: Dependency and workspace management.
-   **`.env.example`**: Example environment file.
-   **`Makefile` / `*.sh`**: Utility scripts for development and deployment.
-   **`package.json`**: Root package file with scripts to run frontend and backend concurrently.
-   **`tsconfig.json`**: TypeScript configuration.

---

**Previous:** [Features](./FEATURES.md) | **Next:** [AI Providers](./AI_PROVIDERS.md)
