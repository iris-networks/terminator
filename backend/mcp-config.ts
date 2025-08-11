import * as os from 'os';
import * as path from 'path';

export const mcpConfig = {
  enabled: true,
  defaultTimeout: 10000,
  maxConcurrentConnections: 5,
  retryAttempts: 3,
  servers: [
    {
      name: "browser",
      description: "Browser automation tools from @agent-infra/mcp-server-browser",
      enabled: true,
      priority: 100,
      timeout: 30000,
      transport: {
        type: "stdio",
        command: "npx",
        args: [
          "@agent-infra/mcp-server-browser@1.2.18",
          "--cdp-endpoint",
          "http://127.0.0.1:9222/json/version",
          "--vision"
        ],
        env: {}
      }
    }
  ]
};