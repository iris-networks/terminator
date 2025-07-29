import { webSearchTool } from './tools/web-search.js';
import { fileReadTool, listFilesTool, createDirectoryTool } from './tools/file-system.js';
import { executeCommandTool } from './tools/command-execution.js';
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
    ...mcpTools,
    ...mcpToolsAvailable
  };
}