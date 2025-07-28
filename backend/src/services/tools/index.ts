// Main tool registry index - combines all modular tools
// This file maintains backward compatibility with the original ToolRegistry.ts

// Import all tools from category modules
import { webSearchTool } from './categories/web-search.js';
import { 
  fileReadTool, 
  fileWriteTool, 
  listFilesTool, 
  createDirectoryTool 
} from './categories/file-system.js';
import { executeCommandTool } from './categories/command-execution.js';
import { 
  browserActionTool, 
  browserGetMarkdownTool, 
  browserClickTool, 
  browserHoverTool 
} from './categories/browser-automation.js';
import { 
  browserPressKeyTool, 
  browserFormInputFillTool, 
  browserTabListTool, 
  browserNewTabTool, 
  browserCloseTabTool, 
  browserSwitchTabTool 
} from './categories/browser-tabs.js';
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
  fileWriteTool,
  listFilesTool,
  createDirectoryTool,
  
  // Command execution
  executeCommandTool,
  
  // Browser automation
  browserActionTool,
  browserGetMarkdownTool,
  browserClickTool,
  browserHoverTool,
  browserPressKeyTool,
  browserFormInputFillTool,
  
  // Browser tabs
  browserTabListTool,
  browserNewTabTool,
  browserCloseTabTool,
  browserSwitchTabTool,
};

// Export MCP utilities
export { initializeMCP, getMCPStatus };

// Static tools object (for backward compatibility)
export const tools = {
  web_search: webSearchTool,
  file_read: fileReadTool,
  file_write: fileWriteTool,
  list_files: listFilesTool,
  create_directory: createDirectoryTool,
  execute_command: executeCommandTool,
  browser_action: browserActionTool,
  browser_get_markdown: browserGetMarkdownTool,
  browser_click: browserClickTool,
  browser_hover: browserHoverTool,
  browser_press_key: browserPressKeyTool,
  browser_form_input_fill: browserFormInputFillTool,
  browser_tab_list: browserTabListTool,
  browser_new_tab: browserNewTabTool,
  browser_close_tab: browserCloseTabTool,
  browser_switch_tab: browserSwitchTabTool,
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
  fileWriteTool,
  listFilesTool,
  createDirectoryTool,
  executeCommandTool,
  browserActionTool,
  browserGetMarkdownTool,
  browserClickTool,
  browserHoverTool,
  browserPressKeyTool,
  browserFormInputFillTool,
  browserTabListTool,
  browserNewTabTool,
  browserCloseTabTool,
  browserSwitchTabTool,
};