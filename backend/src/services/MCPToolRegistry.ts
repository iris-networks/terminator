import { tool } from 'ai';
import { z } from 'zod';
import { MCPManager } from './MCPManager.js';
import { MCPConfig, MCPConfigSchema, MCPToolCall } from '../types/mcp.js';
import { promises as fs } from 'fs';
import path from 'path';

const CONFIG_PATH = process.env.MCP_CONFIG_PATH || path.join(process.cwd(), 'mcp-config.json');

export class MCPToolRegistry {
  private static instance: MCPToolRegistry;
  private mcpManager: MCPManager | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): MCPToolRegistry {
    if (!MCPToolRegistry.instance) {
      MCPToolRegistry.instance = new MCPToolRegistry();
    }
    return MCPToolRegistry.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Load MCP configuration
      const config = await this.loadConfiguration();
      
      if (!config.enabled) {
        console.log('🔌 MCP tools disabled in configuration');
        this.isInitialized = true;
        return;
      }

      // Initialize MCP Manager
      this.mcpManager = MCPManager.getInstance(config);
      await this.mcpManager.initialize();

      console.log('✅ MCP Tool Registry initialized');
      this.isInitialized = true;

    } catch (error) {
      console.error('❌ Failed to initialize MCP Tool Registry:', error);
      // Continue without MCP if initialization fails
      this.isInitialized = true;
    }
  }

  private async loadConfiguration(): Promise<MCPConfig> {
    try {
      // Check if config file exists
      await fs.access(CONFIG_PATH);
      
      // Read and parse config
      const configData = await fs.readFile(CONFIG_PATH, 'utf-8');
      const rawConfig = JSON.parse(configData);
      
      // Validate config against schema
      const config = MCPConfigSchema.parse(rawConfig);
      console.log(`📋 Loaded MCP configuration with ${config.servers.length} servers`);
      
      return config;
      
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log('📋 No MCP configuration file found, using defaults');
        return this.getDefaultConfiguration();
      }
      
      console.error('❌ Error loading MCP configuration:', error);
      throw error;
    }
  }

  private getDefaultConfiguration(): MCPConfig {
    return {
      enabled: false,
      defaultTimeout: 10000,
      maxConcurrentConnections: 5,
      retryAttempts: 3,
      servers: []
    };
  }

  async saveConfiguration(config: MCPConfig): Promise<void> {
    try {
      // Validate config
      const validatedConfig = MCPConfigSchema.parse(config);
      
      // Write to file
      await fs.writeFile(CONFIG_PATH, JSON.stringify(validatedConfig, null, 2), 'utf-8');
      
      // Update MCP manager if initialized
      if (this.mcpManager) {
        this.mcpManager.updateConfig(validatedConfig);
      }
      
      console.log('✅ MCP configuration saved');
    } catch (error) {
      console.error('❌ Failed to save MCP configuration:', error);
      throw error;
    }
  }

  getMCPTools(): Record<string, any> {
    if (!this.mcpManager) {
      return {};
    }

    return this.mcpManager.getAllTools();
  }

  getToolsForAgent(agentType: string): Record<string, any> {
    // Get all MCP tools (could be filtered by agent type in the future)
    return this.getMCPTools();
  }

  async executeMCPTool(toolCall: MCPToolCall) {
    if (!this.mcpManager) {
      throw new Error('MCP Manager not initialized');
    }

    return await this.mcpManager.executeTool(toolCall);
  }

  getStatus() {
    if (!this.mcpManager) {
      return {
        enabled: false,
        initialized: this.isInitialized,
        totalServers: 0,
        connectedServers: 0,
        totalTools: 0
      };
    }

    const mcpStatus = this.mcpManager.getStatus();
    return {
      ...mcpStatus,
      initialized: this.isInitialized
    };
  }

  async shutdown(): Promise<void> {
    if (this.mcpManager) {
      await this.mcpManager.shutdown();
      this.mcpManager = null;
    }
    this.isInitialized = false;
  }
}

// MCP management tools for agents to use
export const mcpListServersTool = tool({
  description: 'List all configured MCP servers and their status',
  parameters: z.object({
    includeDisabled: z.boolean().optional().default(false).describe('Include disabled servers in the list')
  }),
  execute: async ({ includeDisabled }) => {
    console.log('📋 Listing MCP servers');
    
    try {
      const registry = MCPToolRegistry.getInstance();
      await registry.initialize();
      
      const status = registry.getStatus();
      
      if (!status.enabled) {
        return {
          enabled: false,
          message: 'MCP integration is disabled',
          servers: [],
          timestamp: new Date().toISOString()
        };
      }

      const servers = ('connections' in status ? status.connections : []).filter((conn: any) => 
        includeDisabled || conn.config.enabled
      );

      return {
        enabled: true,
        totalServers: servers.length,
        connectedServers: servers.filter((s: any) => s.connected).length,
        servers: servers.map((server: any) => ({
          name: server.name,
          description: server.config.description,
          enabled: server.config.enabled,
          connected: server.connected,
          toolCount: server.toolCount,
          transportType: server.config.transport.type,
          lastError: server.lastError,
          connectionTime: server.connectionTime
        })),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error listing MCP servers:', error);
      return {
        enabled: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        servers: [],
        timestamp: new Date().toISOString()
      };
    }
  }
});

export const mcpListToolsTool = tool({
  description: 'List all available MCP tools from connected servers',
  parameters: z.object({
    serverName: z.string().optional().describe('Filter tools by specific server name')
  }),
  execute: async ({ serverName }) => {
    console.log(`🔧 Listing MCP tools${serverName ? ` for server: ${serverName}` : ''}`);
    
    try {
      const registry = MCPToolRegistry.getInstance();
      await registry.initialize();
      
      const status = registry.getStatus();
      
      if (!status.enabled) {
        return {
          enabled: false,
          message: 'MCP integration is disabled',
          tools: [],
          timestamp: new Date().toISOString()
        };
      }

      let tools: any[] = [];
      
      if (serverName) {
        // Get tools from specific server
        const connection = ('connections' in status ? status.connections : []).find((c: any) => c.name === serverName);
        if (connection && connection.connected) {
          tools = Object.entries(connection.tools).map(([name, tool]: [string, any]) => ({
            name: `${serverName}_${name}`,
            originalName: name,
            server: serverName,
            description: tool.description || 'No description available',
            parameters: tool.parameters || {}
          }));
        }
      } else {
        // Get all tools from all servers
        const allMCPTools = registry.getMCPTools();
        tools = Object.entries(allMCPTools).map(([name, tool]: [string, any]) => ({
          name,
          originalName: tool._originalName,
          server: tool._mcpServer,
          description: tool.description || 'No description available',
          parameters: tool.parameters || {}
        }));
      }

      return {
        enabled: true,
        serverName,
        totalTools: tools.length,
        tools,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error listing MCP tools:', error);
      return {
        enabled: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        tools: [],
        timestamp: new Date().toISOString()
      };
    }
  }
});

export const mcpExecuteToolTool = tool({
  description: 'Execute a specific MCP tool with given parameters',
  parameters: z.object({
    serverName: z.string().describe('Name of the MCP server'),
    toolName: z.string().describe('Name of the tool to execute'),
    parameters: z.record(z.any()).default({}).describe('Parameters to pass to the tool')
  }),
  execute: async ({ serverName, toolName, parameters }) => {
    console.log(`🔧 Executing MCP tool: ${toolName} on server: ${serverName}`);
    
    try {
      const registry = MCPToolRegistry.getInstance();
      await registry.initialize();
      
      const toolCall: MCPToolCall = {
        serverId: serverName,
        toolName,
        parameters
      };

      const result = await registry.executeMCPTool(toolCall);
      
      return {
        success: result.success,
        result: result.result,
        error: result.error,
        executionTime: result.executionTime,
        serverName: result.serverId,
        toolName: result.toolName,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error executing MCP tool:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: 0,
        serverName,
        toolName,
        timestamp: new Date().toISOString()
      };
    }
  }
});

export const mcpHealthCheckTool = tool({
  description: 'Check the health status of MCP integration and connections',
  parameters: z.object({}),
  execute: async () => {
    console.log('🏥 Performing MCP health check');
    
    try {
      const registry = MCPToolRegistry.getInstance();
      await registry.initialize();
      
      const status = registry.getStatus();
      
      if (!status.enabled) {
        return {
          healthy: true,
          message: 'MCP integration is disabled',
          issues: [],
          timestamp: new Date().toISOString()
        };
      }

      // Get detailed health check from MCP manager
      const mcpManager = (registry as any).mcpManager;
      const healthCheck = mcpManager ? await mcpManager.healthCheck() : { healthy: false, issues: ['MCP Manager not initialized'] };

      return {
        healthy: healthCheck.healthy,
        enabled: status.enabled,
        totalServers: status.totalServers,
        connectedServers: status.connectedServers,
        totalTools: status.totalTools,
        issues: healthCheck.issues,
        lastUpdate: 'lastUpdate' in status ? status.lastUpdate : new Date(),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error during MCP health check:', error);
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        issues: ['Health check failed'],
        timestamp: new Date().toISOString()
      };
    }
  }
});

export const mcpConfigureTool = tool({
  description: 'Configure MCP settings and servers',
  parameters: z.object({
    action: z.enum(['get', 'set', 'add_server', 'remove_server', 'enable_server', 'disable_server']).describe('Configuration action to perform'),
    serverName: z.string().optional().describe('Server name (required for server-specific actions)'),
    serverConfig: z.object({
      name: z.string(),
      description: z.string().optional(),
      enabled: z.boolean().default(true),
      priority: z.number().default(50),
      timeout: z.number().optional(),
      transport: z.object({
        type: z.enum(['stdio', 'sse']),
        command: z.string().optional(),
        args: z.array(z.string()).optional(),
        env: z.record(z.string()).optional(),
        cwd: z.string().optional(),
        url: z.string().optional(),
        headers: z.record(z.string()).optional()
      })
    }).optional().describe('Server configuration (required for add_server action)'),
    globalConfig: z.object({
      enabled: z.boolean().optional(),
      defaultTimeout: z.number().optional(),
      maxConcurrentConnections: z.number().optional(),
      retryAttempts: z.number().optional()
    }).optional().describe('Global MCP configuration settings')
  }),
  execute: async ({ action, serverName, serverConfig, globalConfig }) => {
    console.log(`⚙️ MCP configuration action: ${action}`);
    
    try {
      const registry = MCPToolRegistry.getInstance();
      await registry.initialize();
      
      // Load current configuration
      const currentConfig = await (registry as any).loadConfiguration();
      
      switch (action) {
        case 'get':
          return {
            success: true,
            config: currentConfig,
            timestamp: new Date().toISOString()
          };
          
        case 'set':
          if (!globalConfig) {
            throw new Error('globalConfig is required for set action');
          }
          
          const updatedConfig = { ...currentConfig, ...globalConfig };
          await registry.saveConfiguration(updatedConfig);
          
          return {
            success: true,
            message: 'Global configuration updated',
            config: updatedConfig,
            timestamp: new Date().toISOString()
          };
          
        case 'add_server':
          if (!serverConfig) {
            throw new Error('serverConfig is required for add_server action');
          }
          
          // Check if server already exists
          const existingServerIndex = currentConfig.servers.findIndex((s: any) => s.name === serverConfig.name);
          if (existingServerIndex >= 0) {
            // Update existing server
            currentConfig.servers[existingServerIndex] = serverConfig as any;
          } else {
            // Add new server
            currentConfig.servers.push(serverConfig as any);
          }
          
          await registry.saveConfiguration(currentConfig);
          
          return {
            success: true,
            message: `Server ${serverConfig.name} ${existingServerIndex >= 0 ? 'updated' : 'added'}`,
            config: currentConfig,
            timestamp: new Date().toISOString()
          };
          
        case 'remove_server':
          if (!serverName) {
            throw new Error('serverName is required for remove_server action');
          }
          
          const serverIndex = currentConfig.servers.findIndex((s: any) => s.name === serverName);
          if (serverIndex < 0) {
            throw new Error(`Server ${serverName} not found`);
          }
          
          currentConfig.servers.splice(serverIndex, 1);
          await registry.saveConfiguration(currentConfig);
          
          return {
            success: true,
            message: `Server ${serverName} removed`,
            config: currentConfig,
            timestamp: new Date().toISOString()
          };
          
        case 'enable_server':
        case 'disable_server':
          if (!serverName) {
            throw new Error(`serverName is required for ${action} action`);
          }
          
          const targetServer = currentConfig.servers.find((s: any) => s.name === serverName);
          if (!targetServer) {
            throw new Error(`Server ${serverName} not found`);
          }
          
          targetServer.enabled = action === 'enable_server';
          await registry.saveConfiguration(currentConfig);
          
          return {
            success: true,
            message: `Server ${serverName} ${action === 'enable_server' ? 'enabled' : 'disabled'}`,
            config: currentConfig,
            timestamp: new Date().toISOString()
          };
          
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      
    } catch (error) {
      console.error('❌ Error configuring MCP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
});

// Export MCP management tools
export const mcpTools = {
  mcp_list_servers: mcpListServersTool,
  mcp_list_tools: mcpListToolsTool, 
  mcp_execute_tool: mcpExecuteToolTool,
  mcp_health_check: mcpHealthCheckTool,
  mcp_configure: mcpConfigureTool
};

export default MCPToolRegistry;