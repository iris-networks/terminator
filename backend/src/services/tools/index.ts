// Main tool registry index - combines all modular tools
// This file maintains backward compatibility with the original ToolRegistry.ts

// Import all tools from category modules
import { webSearchTool } from './categories/web-search.js';
import { 
  fileReadTool, 
  listFilesTool, 
  createDirectoryTool 
} from './categories/file-system.js';
import { executeCommandTool } from './categories/command-execution.js';
import { getMCPTools, initializeMCP, getMCPStatus } from './mcp/mcp-integration.js';

// Core utilities (re-exported for convenience)
import { WORKSPACE_PATH } from './core/constants.js';
import { ensureWorkspace, validatePath } from './core/security.js';

export { WORKSPACE_PATH, ensureWorkspace, validatePath };
export * from './core/types.js';

// Export individual tools
export {
  // Web search
  webSearchTool,
  
  // File system
  fileReadTool,
  listFilesTool,
  createDirectoryTool,
  
  // Command execution
  executeCommandTool,
};

// Export MCP utilities
export { initializeMCP, getMCPStatus };

// Static tools object (for backward compatibility)
export const tools = {
  web_search: webSearchTool,
  file_read: fileReadTool,
  list_files: listFilesTool,
  create_directory: createDirectoryTool,
  execute_command: executeCommandTool,
};

/**
 * Get all tools including dynamic MCP tools
 * This is the main function used by AI agents to get available tools
 */
export async function getAllTools(): Promise<Record<string, any>> {
  try {
    // Get MCP tools (includes both management tools and dynamic tools)
    const mcpTools = await getMCPTools();
    
    // Combine static tools with MCP tools
    return {
      ...tools,
      ...mcpTools
    };
  } catch (error) {
    console.error('Failed to get all tools:', error);
    
    // Return static tools if MCP integration fails
    return tools;
  }
}

// Default export maintains backward compatibility
export default {
  tools,
  getAllTools,
  initializeMCP,
  getMCPStatus,
  
  // Core utilities
  WORKSPACE_PATH,
  ensureWorkspace,
  validatePath,
  
  // Individual tools
  webSearchTool,
  fileReadTool,
  listFilesTool,
  createDirectoryTool,
  executeCommandTool,
};