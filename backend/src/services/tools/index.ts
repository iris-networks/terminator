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
import { 
  browserActionTool, 
  browserGetMarkdownTool, 
  browserClickTool, 
  browserHoverTool,
  browserEvaluateTool,
  browserGoBackTool,
  browserGoForwardTool,
  browserDoubleClickTool,
  browserRightClickTool,
  browserDragAndDropTool,
  browserGetLinksTool,
  browserGetClickableElementsTool
} from './categories/browser-automation.js';
import { 
  browserPressKeyTool, 
  browserFormInputFillTool, 
  browserTabListTool, 
  browserNewTabTool, 
  browserCloseTabTool, 
  browserSwitchTabTool 
} from './categories/browser-tabs.js';
import {
  browserVisionScreenCaptureTool,
  browserVisionScreenClickTool,
  browserDownloadHandlerTool,
  browserFileUploadTool,
  browserWaitForNetworkIdleTool,
  browserElementHighlightTool,
  browserCookieManagerTool
} from './categories/browser-advanced.js';
import {
  browserSearchTool,
  browserConcurrentSearchTool
} from './categories/browser-search.js';
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
  
  // Browser automation
  browserActionTool,
  browserGetMarkdownTool,
  browserClickTool,
  browserHoverTool,
  browserEvaluateTool,
  browserGoBackTool,
  browserGoForwardTool,
  browserDoubleClickTool,
  browserRightClickTool,
  browserDragAndDropTool,
  browserGetLinksTool,
  browserGetClickableElementsTool,
  browserPressKeyTool,
  browserFormInputFillTool,
  
  // Browser tabs
  browserTabListTool,
  browserNewTabTool,
  browserCloseTabTool,
  browserSwitchTabTool,
  
  // Browser advanced
  browserVisionScreenCaptureTool,
  browserVisionScreenClickTool,
  browserDownloadHandlerTool,
  browserFileUploadTool,
  browserWaitForNetworkIdleTool,
  browserElementHighlightTool,
  browserCookieManagerTool,
  
  // Browser search
  browserSearchTool,
  browserConcurrentSearchTool,
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
  
  // Browser automation
  browser_action: browserActionTool,
  browser_get_markdown: browserGetMarkdownTool,
  browser_click: browserClickTool,
  browser_hover: browserHoverTool,
  browser_evaluate: browserEvaluateTool,
  browser_go_back: browserGoBackTool,
  browser_go_forward: browserGoForwardTool,
  browser_double_click: browserDoubleClickTool,
  browser_right_click: browserRightClickTool,
  browser_drag_and_drop: browserDragAndDropTool,
  browser_get_links: browserGetLinksTool,
  browser_get_clickable_elements: browserGetClickableElementsTool,
  browser_press_key: browserPressKeyTool,
  browser_form_input_fill: browserFormInputFillTool,
  
  // Browser tabs
  browser_tab_list: browserTabListTool,
  browser_new_tab: browserNewTabTool,
  browser_close_tab: browserCloseTabTool,
  browser_switch_tab: browserSwitchTabTool,
  
  // Browser advanced
  browser_vision_screen_capture: browserVisionScreenCaptureTool,
  browser_vision_screen_click: browserVisionScreenClickTool,
  browser_download_handler: browserDownloadHandlerTool,
  browser_file_upload: browserFileUploadTool,
  browser_wait_for_network_idle: browserWaitForNetworkIdleTool,
  browser_element_highlight: browserElementHighlightTool,
  browser_cookie_manager: browserCookieManagerTool,
  
  // Browser search
  browser_search: browserSearchTool,
  browser_concurrent_search: browserConcurrentSearchTool,
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
  browserActionTool,
  browserGetMarkdownTool,
  browserClickTool,
  browserHoverTool,
  browserEvaluateTool,
  browserGoBackTool,
  browserGoForwardTool,
  browserDoubleClickTool,
  browserRightClickTool,
  browserDragAndDropTool,
  browserGetLinksTool,
  browserGetClickableElementsTool,
  browserPressKeyTool,
  browserFormInputFillTool,
  browserTabListTool,
  browserNewTabTool,
  browserCloseTabTool,
  browserSwitchTabTool,
  browserVisionScreenCaptureTool,
  browserVisionScreenClickTool,
  browserDownloadHandlerTool,
  browserFileUploadTool,
  browserWaitForNetworkIdleTool,
  browserElementHighlightTool,
  browserCookieManagerTool,
  browserSearchTool,
  browserConcurrentSearchTool,
};