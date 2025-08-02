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
// Main tool registry index - combines all modular tools
// This file maintains backward compatibility with the original ToolRegistry.ts

// Import all tools from category modules  
import { searchTool } from '../../agents/research/enhanced-search.js';
import { visitLinkTool } from '../../agents/research/enhanced-visit.js';
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
  searchTool,
  visitLinkTool,
  
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
  web_search: searchTool,
  visit_link: visitLinkTool,
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
  searchTool,
  visitLinkTool,
  fileReadTool,
  listFilesTool,
  createDirectoryTool,
  executeCommandTool,
};