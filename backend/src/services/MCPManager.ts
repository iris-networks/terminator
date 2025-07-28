import { experimental_createMCPClient } from 'ai';
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';
import EventEmitter from 'events';
import {
  MCPConfig,
  MCPServerConfig,
  MCPServerConnection,
  MCPTransportType,
  MCPManagerStatus,
  MCPToolCall,
  MCPToolResult,
  MCPStdioConfig,
  MCPSSEConfig
} from '../types/mcp.js';

export class MCPManager extends EventEmitter {
  private static instance: MCPManager;
  private config: MCPConfig;
  private connections: Map<string, MCPServerConnection> = new Map();
  private clients: Map<string, any> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private isShuttingDown = false;

  private constructor(config: MCPConfig) {
    super();
    this.config = config;
  }

  static getInstance(config?: MCPConfig): MCPManager {
    if (!MCPManager.instance && config) {
      MCPManager.instance = new MCPManager(config);
    } else if (!MCPManager.instance) {
      throw new Error('MCPManager must be initialized with config first');
    }
    return MCPManager.instance;
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      console.log('🔌 MCP integration is disabled');
      return;
    }

    console.log(`🚀 Initializing MCP Manager with ${this.config.servers.length} servers`);

    // Initialize connections to all enabled servers
    const enabledServers = this.config.servers.filter(server => server.enabled);
    const connectionPromises = enabledServers.map(server => this.connectToServer(server));

    // Wait for all connections to complete (some may fail)
    await Promise.allSettled(connectionPromises);

    console.log(`✅ MCP Manager initialized. Connected: ${this.getConnectedCount()}/${enabledServers.length}`);
    this.emit('initialized', this.getStatus());
  }

  private async connectToServer(serverConfig: MCPServerConfig): Promise<void> {
    const connection: MCPServerConnection = {
      name: serverConfig.name,
      config: serverConfig,
      tools: {},
      connected: false,
      toolCount: 0
    };

    this.connections.set(serverConfig.name, connection);

    try {
      console.log(`🔌 Connecting to MCP server: ${serverConfig.name}`);

      let transport;

      if (serverConfig.transport.type === MCPTransportType.STDIO) {
        const stdioConfig = serverConfig.transport as MCPStdioConfig;
        
        // Create stdio transport using AI SDK experimental transport
        transport = new Experimental_StdioMCPTransport({
          command: stdioConfig.command,
          args: stdioConfig.args || [],
          env: stdioConfig.env,
          cwd: stdioConfig.cwd
        });

      } else if (serverConfig.transport.type === MCPTransportType.SSE) {
        // For SSE, we'll use a simple HTTP transport for now
        // TODO: Implement proper SSE transport when available
        throw new Error('SSE transport not yet implemented. Use stdio transport instead.');
      } else {
        throw new Error(`Unsupported transport type: ${(serverConfig.transport as any).type}`);
      }

      // Create MCP client
      const client = await experimental_createMCPClient({
        name: `terminator-${serverConfig.name}`,
        transport
      });

      // Store client reference for cleanup
      this.clients.set(serverConfig.name, client);

      // Get tools from the server
      const tools = await client.tools();

      // Update connection
      connection.client = client;
      connection.tools = tools;
      connection.connected = true;
      connection.connectionTime = new Date();
      connection.toolCount = Object.keys(tools).length;
      connection.lastError = undefined;

      // Reset retry attempts on successful connection
      this.reconnectAttempts.delete(serverConfig.name);

      console.log(`✅ Connected to MCP server: ${serverConfig.name} (${connection.toolCount} tools)`);
      this.emit('serverConnected', { serverName: serverConfig.name, toolCount: connection.toolCount });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to connect to MCP server ${serverConfig.name}:`, errorMessage);
      
      connection.connected = false;
      connection.lastError = errorMessage;
      
      this.handleConnectionError(serverConfig.name, errorMessage);
      this.emit('serverError', { serverName: serverConfig.name, error: errorMessage });
    }
  }

  private handleConnectionError(serverName: string, error: string): void {
    const connection = this.connections.get(serverName);
    if (!connection) return;

    connection.connected = false;
    connection.lastError = error;

    // Implement retry logic
    const retryCount = this.reconnectAttempts.get(serverName) || 0;
    if (retryCount < this.config.retryAttempts && !this.isShuttingDown) {
      this.reconnectAttempts.set(serverName, retryCount + 1);
      
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Exponential backoff
      console.log(`🔄 Retrying connection to ${serverName} in ${delay}ms (attempt ${retryCount + 1}/${this.config.retryAttempts})`);
      
      setTimeout(() => {
        if (!this.isShuttingDown) {
          this.connectToServer(connection.config);
        }
      }, delay);
    } else {
      console.error(`❌ Max retry attempts reached for ${serverName}`);
    }
  }


  async executeTool(toolCall: MCPToolCall): Promise<MCPToolResult> {
    const startTime = Date.now();
    const connection = this.connections.get(toolCall.serverId);

    if (!connection) {
      return {
        success: false,
        error: `Server not found: ${toolCall.serverId}`,
        executionTime: Date.now() - startTime,
        serverId: toolCall.serverId,
        toolName: toolCall.toolName
      };
    }

    if (!connection.connected || !connection.client) {
      return {
        success: false,
        error: `Server not connected: ${toolCall.serverId}`,
        executionTime: Date.now() - startTime,
        serverId: toolCall.serverId,
        toolName: toolCall.toolName
      };
    }

    const tool = connection.tools[toolCall.toolName];
    if (!tool) {
      return {
        success: false,
        error: `Tool not found: ${toolCall.toolName} on server ${toolCall.serverId}`,
        executionTime: Date.now() - startTime,
        serverId: toolCall.serverId,
        toolName: toolCall.toolName
      };
    }

    try {
      console.log(`🔧 Executing MCP tool: ${toolCall.toolName} on ${toolCall.serverId}`);
      
      // Execute the tool with timeout
      const timeout = connection.config.timeout || this.config.defaultTimeout;
      const executePromise = tool.execute(toolCall.parameters);
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Tool execution timeout')), timeout);
      });

      const result = await Promise.race([executePromise, timeoutPromise]);

      console.log(`✅ MCP tool executed successfully: ${toolCall.toolName}`);
      
      return {
        success: true,
        result,
        executionTime: Date.now() - startTime,
        serverId: toolCall.serverId,
        toolName: toolCall.toolName
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ MCP tool execution failed: ${toolCall.toolName}`, errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        executionTime: Date.now() - startTime,
        serverId: toolCall.serverId,
        toolName: toolCall.toolName
      };
    }
  }

  getAllTools(): Record<string, any> {
    const allTools: Record<string, any> = {};

    for (const [serverName, connection] of this.connections) {
      if (connection.connected && connection.tools) {
        // Prefix tool names with server name to avoid conflicts
        for (const [toolName, tool] of Object.entries(connection.tools)) {
          const prefixedName = `${serverName}_${toolName}`;
          allTools[prefixedName] = {
            ...tool,
            _mcpServer: serverName,
            _originalName: toolName
          };
        }
      }
    }

    return allTools;
  }

  getServerTools(serverName: string): Record<string, any> {
    const connection = this.connections.get(serverName);
    return connection?.connected ? connection.tools : {};
  }

  getStatus(): MCPManagerStatus {
    const connections = Array.from(this.connections.values());
    const connectedServers = connections.filter(c => c.connected).length;
    const totalTools = connections.reduce((sum, c) => sum + c.toolCount, 0);

    return {
      enabled: this.config.enabled,
      totalServers: this.connections.size,
      connectedServers,
      totalTools,
      connections: connections.map(c => ({
        name: c.name,
        config: c.config,
        tools: c.tools,
        connected: c.connected,
        lastError: c.lastError,
        connectionTime: c.connectionTime,
        toolCount: c.toolCount
      })),
      lastUpdate: new Date()
    };
  }

  private getConnectedCount(): number {
    return Array.from(this.connections.values()).filter(c => c.connected).length;
  }

  updateConfig(newConfig: MCPConfig): void {
    console.log('🔄 Updating MCP configuration');
    this.config = newConfig;

    // Handle server additions/removals
    const newServerNames = new Set(newConfig.servers.map(s => s.name));
    const currentServerNames = new Set(this.connections.keys());

    // Remove servers that are no longer in config
    for (const serverName of currentServerNames) {
      if (!newServerNames.has(serverName)) {
        this.disconnectServer(serverName);
      }
    }

    // Add or update servers
    for (const serverConfig of newConfig.servers) {
      if (serverConfig.enabled) {
        if (!this.connections.has(serverConfig.name)) {
          // New server
          this.connectToServer(serverConfig);
        } else {
          // Update existing server if config changed
          const existingConnection = this.connections.get(serverConfig.name);
          if (existingConnection && JSON.stringify(existingConnection.config) !== JSON.stringify(serverConfig)) {
            this.disconnectServer(serverConfig.name);
            setTimeout(() => this.connectToServer(serverConfig), 1000);
          }
        }
      } else {
        // Server disabled
        if (this.connections.has(serverConfig.name)) {
          this.disconnectServer(serverConfig.name);
        }
      }
    }
  }

  private async disconnectServer(serverName: string): Promise<void> {
    console.log(`🔌 Disconnecting MCP server: ${serverName}`);
    
    const connection = this.connections.get(serverName);
    if (connection) {
      connection.connected = false;
      
      // Close MCP client
      const client = this.clients.get(serverName);
      if (client) {
        try {
          await client.close();
        } catch (error) {
          console.error(`Error closing MCP client for ${serverName}:`, error);
        }
        this.clients.delete(serverName);
      }

      // Remove connection
      this.connections.delete(serverName);
      this.reconnectAttempts.delete(serverName);
    }

    this.emit('serverDisconnected', { serverName });
  }

  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down MCP Manager');
    this.isShuttingDown = true;

    // Disconnect all servers
    const disconnectPromises = Array.from(this.connections.keys()).map(
      serverName => this.disconnectServer(serverName)
    );

    await Promise.allSettled(disconnectPromises);

    // Clear all data
    this.connections.clear();
    this.clients.clear();
    this.reconnectAttempts.clear();

    console.log('✅ MCP Manager shutdown complete');
    this.emit('shutdown');
  }

  // Health check method
  async healthCheck(): Promise<{ healthy: boolean; issues: string[] }> {
    const issues: string[] = [];
    let healthy = true;

    if (!this.config.enabled) {
      return { healthy: true, issues: ['MCP integration disabled'] };
    }

    // Check connection counts
    const enabledServers = this.config.servers.filter(s => s.enabled);
    const connectedCount = this.getConnectedCount();
    
    if (connectedCount === 0 && enabledServers.length > 0) {
      healthy = false;
      issues.push('No MCP servers connected');
    }

    // Check individual connections
    for (const connection of this.connections.values()) {
      if (connection.config.enabled && !connection.connected) {
        healthy = false;
        issues.push(`Server ${connection.name} disconnected: ${connection.lastError || 'Unknown error'}`);
      }
    }

    // Check for stale clients
    for (const [serverName] of this.clients) {
      const connection = this.connections.get(serverName);
      if (!connection || !connection.connected) {
        issues.push(`Stale client detected for server ${serverName}`);
      }
    }

    return { healthy, issues };
  }
}

export default MCPManager;