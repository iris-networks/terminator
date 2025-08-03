# Getting Started

This guide will help you get up and running with Iris.

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/iris-networks/terminator.git
    cd terminator
    ```
2.  **Install dependencies:**
    ```bash
    bun install
    ```
3.  **Set up your environment:**
    ```bash
    cp .env.example .env
    ```
    A simple quickstart only needs three things. Add the following to your `.env` file:
    ```
    AI_MODEL=claude-sonnet-4-20250514
    AI_PROVIDER=anthropic
    ANTHROPIC_API_KEY=<your-anthropic-api-key>
    ```

## Running the application

```bash
bun run dev:watch
```

---

**Previous:** [Introduction](./INTRODUCTION.md) | **Next:** [Configuration](./CONFIGURATION.md)
