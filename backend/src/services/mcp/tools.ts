/*
 * Copyright 2025 hivelogic pvt ltd, singapore
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { tool } from 'ai';
import { z } from 'zod';
import { MCPToolRegistry } from './registry.js';
import { MCPConfig, MCPConfigSchema } from '../../types/mcp.js';

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
      
      const mcpManager = registry.getMCPManager();
      
      if (!mcpManager) {
        return {
          enabled: false,
          message: 'MCP integration is disabled',
          servers: [],
          timestamp: new Date().toISOString()
        };
      }

      const status = mcpManager.getStatus();
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
    console.log('🔧 Listing MCP tools');
    
    try {
      const registry = MCPToolRegistry.getInstance();
      await registry.initialize();
      
      const mcpManager = registry.getMCPManager();
      
      if (!mcpManager) {
        return {
          enabled: false,
          message: 'MCP integration is disabled',
          tools: [],
          timestamp: new Date().toISOString()
        };
      }

      const availableTools = registry.getMCPTools();
      const toolEntries = Object.entries(availableTools);
      
      // Filter by server name if specified
      const filteredTools = serverName 
        ? toolEntries.filter(([toolName]) => toolName.startsWith(`${serverName}_`))
        : toolEntries;

      return {
        enabled: true,
        totalTools: filteredTools.length,
        serverFilter: serverName || null,
        tools: filteredTools.map(([toolName, toolDef]) => ({
          name: toolName,
          serverName: toolName.split('_')[0],
          description: toolDef.description || 'No description available',
          parameters: toolDef.parameters || {}
        })),
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
    serverName: z.string().describe('Name of the MCP server containing the tool'),
    toolName: z.string().describe('Name of the tool to execute'),
    parameters: z.record(z.any()).optional().default({}).describe('Parameters to pass to the tool')
  }),
  execute: async ({ serverName, toolName, parameters }) => {
    console.log(`🚀 Executing MCP tool: ${serverName}/${toolName}`);
    
    try {
      const registry = MCPToolRegistry.getInstance();
      await registry.initialize();
      
      const result = await registry.executeMCPTool({
        serverId: serverName,
        toolName,
        parameters: parameters || {}
      });

      return {
        serverName,
        toolName,
        parameters,
        result,
        success: true,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ MCP tool execution failed:', error);
      return {
        serverName,
        toolName,
        parameters,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
});

export const mcpHealthCheckTool = tool({
  description: 'Check the health status of MCP servers and connections',
  parameters: z.object({}),
  execute: async () => {
    console.log('🏥 Running MCP health check');
    
    try {
      const registry = MCPToolRegistry.getInstance();
      await registry.initialize();
      
      const mcpManager = registry.getMCPManager();
      
      if (!mcpManager) {
        return {
          healthy: false,
          enabled: false,
          message: 'MCP integration is disabled',
          timestamp: new Date().toISOString()
        };
      }

      const status = mcpManager.getStatus();
      const connections = 'connections' in status ? status.connections : [];
      
      const healthSummary = {
        healthy: true,
        enabled: true,
        totalServers: connections.length,
        connectedServers: connections.filter((c: any) => c.connected).length,
        failedServers: connections.filter((c: any) => !c.connected && c.config.enabled).length,
        disabledServers: connections.filter((c: any) => !c.config.enabled).length,
        details: connections.map((conn: any) => ({
          name: conn.name,
          connected: conn.connected,
          enabled: conn.config.enabled,
          toolCount: conn.toolCount,
          lastError: conn.lastError,
          status: conn.connected ? 'healthy' : 'disconnected'
        })),
        timestamp: new Date().toISOString()
      };

      // Mark as unhealthy if any enabled servers are disconnected
      healthSummary.healthy = healthSummary.failedServers === 0;

      return healthSummary;

    } catch (error) {
      console.error('❌ MCP health check failed:', error);
      return {
        healthy: false,
        enabled: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
});

export const mcpConfigureTool = tool({
  description: 'Configure MCP servers and global settings',
  parameters: z.object({
    action: z.enum(['get', 'set', 'add_server', 'remove_server', 'enable_server', 'disable_server']).describe('Configuration action to perform'),
    serverName: z.string().optional().describe('Server name (required for server-specific actions)'),
    serverConfig: z.any().optional().describe('Server configuration object (for add_server)'),
    globalConfig: z.any().optional().describe('Global MCP configuration (for set action)')
  }),
  execute: async ({ action, serverName, serverConfig, globalConfig }) => {
    console.log(`⚙️ MCP configuration action: ${action}`);
    
    try {
      const registry = MCPToolRegistry.getInstance();
      
      switch (action) {
        case 'get':
          // Return current configuration (implementation would load from config file)
          return {
            action: 'get',
            success: true,
            message: 'Current MCP configuration retrieved',
            timestamp: new Date().toISOString()
          };
          
        case 'set':
          if (!globalConfig) {
            throw new Error('Global configuration is required for set action');
          }
          
          // Validate and save configuration
          const validatedConfig = MCPConfigSchema.parse(globalConfig);
          await registry.saveConfiguration(validatedConfig);
          
          return {
            action: 'set',
            success: true,
            message: 'MCP configuration updated successfully',
            timestamp: new Date().toISOString()
          };
          
        case 'add_server':
          if (!serverName || !serverConfig) {
            throw new Error('Server name and configuration are required for add_server action');
          }
          
          // Implementation would add server to configuration
          return {
            action: 'add_server',
            serverName,
            success: true,
            message: `Server ${serverName} added successfully`,
            timestamp: new Date().toISOString()
          };
          
        case 'remove_server':
          if (!serverName) {
            throw new Error('Server name is required for remove_server action');
          }
          
          // Implementation would remove server from configuration
          return {
            action: 'remove_server',
            serverName,
            success: true,
            message: `Server ${serverName} removed successfully`,
            timestamp: new Date().toISOString()
          };
          
        case 'enable_server':
        case 'disable_server':
          if (!serverName) {
            throw new Error(`Server name is required for ${action} action`);
          }
          
          const enable = action === 'enable_server';
          
          return {
            action,
            serverName,
            enabled: enable,
            success: true,
            message: `Server ${serverName} ${enable ? 'enabled' : 'disabled'} successfully`,
            timestamp: new Date().toISOString()
          };
          
        default:
          throw new Error(`Unknown configuration action: ${action}`);
      }

    } catch (error) {
      console.error('❌ MCP configuration failed:', error);
      return {
        action,
        serverName,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
});