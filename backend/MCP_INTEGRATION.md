# MCP (Model Context Protocol) Integration

This document describes the Model Context Protocol (MCP) integration added to the Terminator AI system, which allows agents to dynamically connect to and use tools from external MCP servers.

## Overview

The MCP integration enables the AI agents to:
- Connect to external MCP servers using stdio or SSE transports
- Dynamically discover and use tools from connected servers
- Manage multiple MCP server connections with configuration
- Provide built-in management tools for MCP operations
- Integrate seamlessly with the existing agent system

## Architecture

### Core Components

1. **MCPManager** (`src/services/MCPManager.ts`)
   - Manages connections to multiple MCP servers
   - Handles connection lifecycle (connect, disconnect, reconnect)
   - Provides tool execution interface
   - Implements health checking and monitoring

2. **MCPToolRegistry** (`src/services/MCPToolRegistry.ts`)
   - Central registry for MCP configuration and tools
   - Provides management tools for MCP operations
   - Handles configuration loading and saving
   - Integrates with the main tool registry

3. **MCP Types** (`src/types/mcp.ts`)
   - TypeScript definitions for MCP configuration
   - Zod schemas for validation
   - Interface definitions for connections and tools

### Integration Points

- **ToolRegistry** - Extended to include MCP tools via `getAllTools()`
- **AgentTARS** - Updated to use MCP-enabled tool sets
- **AI Service** - Can use MCP tools through the standard tool interface

## Configuration

### Configuration File

MCP servers are configured via `mcp-config.json` in the backend directory:

```json
{
  "enabled": true,
  "defaultTimeout": 10000,
  "maxConcurrentConnections": 5,
  "retryAttempts": 3,
  "servers": [
    {
      "name": "memory",
      "description": "Memory and context management MCP server",
      "enabled": true,
      "priority": 90,
      "timeout": 15000,
      "transport": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-memory@latest"]
      }
    }
  ]
}
```

### Transport Types

#### STDIO Transport
Uses standard input/output streams to communicate with MCP servers:

```json
{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "server-package@latest"],
  "env": {
    "NODE_ENV": "production"
  },
  "cwd": "/path/to/working/directory"
}
```

#### SSE Transport (Planned)
Uses HTTP Server-Sent Events for remote MCP servers:

```json
{
  "type": "sse",
  "url": "http://localhost:8080/sse",
  "headers": {
    "Authorization": "Bearer token"
  },
  "timeout": 30000
}
```

## Available MCP Servers

### Included in Configuration

1. **@modelcontextprotocol/server-memory** - Memory/knowledge graph management
2. **@modelcontextprotocol/server-filesystem** - File system operations
3. **@modelcontextprotocol/server-sqlite** - SQLite database operations
4. **@modelcontextprotocol/server-postgres** - PostgreSQL database operations
5. **@modelcontextprotocol/server-brave-search** - Brave search API
6. **@modelcontextprotocol/server-slack** - Slack integration
7. **@smithery/github** - GitHub integration
8. **kubernetes-mcp-server** - Kubernetes cluster management

## Management Tools

The system provides built-in tools for managing MCP servers:

### `mcp_list_servers`
Lists all configured MCP servers and their status:
```typescript
{
  includeDisabled?: boolean // Include disabled servers
}
```

### `mcp_list_tools`
Lists available tools from connected MCP servers:
```typescript
{
  serverName?: string // Filter by specific server
}
```

### `mcp_execute_tool`
Executes a specific MCP tool:
```typescript
{
  serverName: string,
  toolName: string,
  parameters: Record<string, any>
}
```

### `mcp_health_check`
Checks the health status of MCP integration:
```typescript
{} // No parameters
```

### `mcp_configure`
Configures MCP settings and servers:
```typescript
{
  action: 'get' | 'set' | 'add_server' | 'remove_server' | 'enable_server' | 'disable_server',
  serverName?: string,
  serverConfig?: MCPServerConfig,
  globalConfig?: Partial<MCPConfig>
}
```

## Usage Examples

### Connecting to Memory Server

1. Enable the memory server in `mcp-config.json`:
```json
{
  "name": "memory",
  "enabled": true,
  "transport": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-memory@latest"]
  }
}
```

2. The system will automatically connect and make tools available:
   - `memory_create_entities`
   - `memory_create_relations`
   - `memory_add_observations`
   - `memory_read_graph`
   - etc.

### Adding a Custom MCP Server

Use the `mcp_configure` tool to add a new server:

```typescript
await mcpConfigureTool.execute({
  action: 'add_server',
  serverConfig: {
    name: 'custom-server',
    description: 'My custom MCP server',
    enabled: true,
    priority: 50,
    transport: {
      type: 'stdio',
      command: 'node',
      args: ['my-mcp-server.js']
    }
  }
});
```

## Error Handling

The MCP integration includes comprehensive error handling:

- **Connection Failures**: Automatic retry with exponential backoff
- **Tool Execution Errors**: Proper error propagation and logging
- **Configuration Errors**: Validation and helpful error messages
- **Process Management**: Cleanup of spawned processes on shutdown

## Monitoring

### Health Checks
The system provides health monitoring for MCP connections:
- Connection status for each server
- Tool availability counts
- Error tracking and reporting
- Performance metrics

### Logging
Comprehensive logging for debugging and monitoring:
- Connection events
- Tool executions
- Error conditions
- Performance metrics

## Security Considerations

- **Sandboxing**: MCP servers run in separate processes
- **Configuration Validation**: All configs are validated against schemas
- **Resource Limits**: Timeouts and connection limits prevent resource exhaustion
- **Error Isolation**: MCP server failures don't affect the main system

## Testing

### Simple Test
Run the basic MCP integration test:
```bash
npx tsx src/test-mcp-simple.ts
```

### Full Test
Run comprehensive tests (requires build):
```bash
npm run build
node test-mcp.js
```

## Development

### Adding New MCP Servers

1. Add server configuration to `mcp-config.json`
2. Ensure the server package is available via npm
3. Enable the server and restart the system
4. Tools will be automatically discovered and integrated

### Custom Tool Wrappers

MCP tools are automatically prefixed with the server name to avoid conflicts:
- Server: `memory`
- Tool: `create_entities`
- Available as: `memory_create_entities`

### Extending the Integration

The MCP integration is designed to be extensible:
- Add new transport types in `MCPManager`
- Extend configuration schema in `mcp.ts`
- Add management tools in `MCPToolRegistry`

## Troubleshooting

### Common Issues

1. **Server Won't Connect**
   - Check server package is installed
   - Verify command and args in configuration
   - Check server logs for errors

2. **Tools Not Available**
   - Ensure server is connected (`mcp_list_servers`)
   - Check if server provides the expected tools
   - Verify tool permissions and parameters

3. **Performance Issues**
   - Adjust timeout settings
   - Monitor connection counts
   - Check for resource leaks

### Debug Commands

```bash
# Check MCP status
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "mcp_health_check", "tools": true}'

# List available servers
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "mcp_list_servers", "tools": true}'
```

## Future Enhancements

- SSE transport implementation
- Server auto-discovery
- Performance optimization
- Advanced security features
- UI for MCP management
- Integration with more MCP servers