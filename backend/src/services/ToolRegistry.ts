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
import { searchTool } from '../agents/research/enhanced-search.js';
import { visitLinkTool } from '../agents/research/enhanced-visit.js';
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
    web_search: searchTool,
    visit_link: visitLinkTool,
    file_read: fileReadTool,
    list_files: listFilesTool,
    create_directory: createDirectoryTool,
    execute_command: executeCommandTool,
    ...mcpTools,
    ...mcpToolsAvailable
  };
}