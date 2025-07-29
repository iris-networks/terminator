import { MCPToolRegistry } from '../../mcp/registry.js';
import {
  mcpListServersTool,
  mcpListToolsTool,
  mcpExecuteToolTool,
  mcpHealthCheckTool,
  mcpConfigureTool
} from '../../mcp/tools.js';

// Initialize MCP Registry
const mcpRegistry = MCPToolRegistry.getInstance();

/**
 * Get all MCP tools from connected servers
 * This function is used by the main tool registry to include dynamic MCP tools
 */
export async function getMCPTools(): Promise<Record<string, any>> {
  try {
    // Initialize MCP registry if not already done
    await mcpRegistry.initialize();
    
    // Get MCP tools from connected servers
    const mcpToolsAvailable = mcpRegistry.getMCPTools();
    
    const mcpTools = {
      mcp_list_servers: mcpListServersTool,
      mcp_list_tools: mcpListToolsTool,
      mcp_execute_tool: mcpExecuteToolTool,
      mcp_health_check: mcpHealthCheckTool,
      mcp_configure: mcpConfigureTool
    };

    return {
      // MCP management tools (always available)
      ...mcpTools,
      
      // Dynamic MCP tools from connected servers
      ...mcpToolsAvailable
    };
  } catch (error) {
    console.error('Failed to get MCP tools:', error);
    
    // Return only management tools if MCP integration fails
    const mcpTools = {
      mcp_list_servers: mcpListServersTool,
      mcp_list_tools: mcpListToolsTool,
      mcp_execute_tool: mcpExecuteToolTool,
      mcp_health_check: mcpHealthCheckTool,
      mcp_configure: mcpConfigureTool
    };

    return {
      ...mcpTools
    };
  }
}

/**
 * Initialize MCP system
 * Called during application startup to establish MCP connections
 */
export async function initializeMCP(): Promise<void> {
  try {
    await mcpRegistry.initialize();
    console.log('✅ MCP system initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize MCP system:', error);
    // Don't throw - allow system to continue without MCP
  }
}

/**
 * Get MCP system status
 * Useful for health checks and debugging
 */
export function getMCPStatus() {
  return mcpRegistry.getStatus();
}

/**
 * Re-export MCP management tools for easier access
 */
export const mcpTools = {
  mcp_list_servers: mcpListServersTool,
  mcp_list_tools: mcpListToolsTool,
  mcp_execute_tool: mcpExecuteToolTool,
  mcp_health_check: mcpHealthCheckTool,
  mcp_configure: mcpConfigureTool
};