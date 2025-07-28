import { mcpTools, MCPToolRegistry } from '../../MCPToolRegistry.js';

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
    
    return {
      // MCP management tools (always available)
      ...mcpTools,
      
      // Dynamic MCP tools from connected servers
      ...mcpToolsAvailable
    };
  } catch (error) {
    console.error('Failed to get MCP tools:', error);
    
    // Return only management tools if MCP integration fails
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
export { mcpTools } from '../../MCPToolRegistry.js';