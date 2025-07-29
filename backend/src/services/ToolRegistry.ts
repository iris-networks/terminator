import { webSearchTool } from './tools/web-search.js';
import { fileReadTool, listFilesTool, createDirectoryTool } from './tools/file-system.js';
import { executeCommandTool } from './tools/command-execution.js';
import {
  browserActionTool,
  browserGetMarkdownTool,
  browserClickTool,
  browserHoverTool,
  browserPressKeyTool,
  browserFormInputFillTool
} from './tools/browser-tools.js';
import {
  browserTabListTool,
  browserNewTabTool,
  browserCloseTabTool,
  browserSwitchTabTool
} from './tools/browser-tabs.js';
import { MCPToolRegistry } from './mcp/registry.js';
import {
  mcpListServersTool,
  mcpListToolsTool,
  mcpExecuteToolTool,
  mcpHealthCheckTool,
  mcpConfigureTool
} from './mcp/tools.js';

const mcpRegistry = MCPToolRegistry.getInstance();

export async function getAllTools(): Promise<Record<string, any>> {
  await mcpRegistry.initialize();
  const mcpToolsAvailable = mcpRegistry.getMCPTools();
  
  const mcpTools = {
    mcp_list_servers: mcpListServersTool,
    mcp_list_tools: mcpListToolsTool,
    mcp_execute_tool: mcpExecuteToolTool,
    mcp_health_check: mcpHealthCheckTool,
    mcp_configure: mcpConfigureTool
  };
  
  return {
    web_search: webSearchTool,
    file_read: fileReadTool,
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
    ...mcpTools,
    ...mcpToolsAvailable
  };
}