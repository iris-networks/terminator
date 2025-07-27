import { Tool } from '../types/index.js';

export class ToolRegistry {
  private tools = new Map<string, Tool>();

  registerTool(tool: Tool) {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  getTools(): Map<string, Tool> {
    return new Map(this.tools);
  }

  removeTool(name: string): boolean {
    return this.tools.delete(name);
  }
}

// Global tool registry instance
export const toolRegistry = new ToolRegistry();

// Register default tools
toolRegistry.registerTool({
  name: 'web_search',
  description: 'Search the web for current information',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query',
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results to return',
        default: 10,
      },
    },
    required: ['query'],
  },
  handler: async (args: { query: string; maxResults?: number }) => {
    // Placeholder implementation - replace with actual web search
    console.log(`🔍 Web search: "${args.query}"`);
    
    return {
      query: args.query,
      results: [
        {
          title: 'Example Search Result',
          url: 'https://example.com',
          snippet: `Search results for "${args.query}" would appear here. This is a placeholder implementation.`,
        },
      ],
      totalResults: 1,
    };
  },
});

toolRegistry.registerTool({
  name: 'file_read',
  description: 'Read the contents of a file',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The file path to read',
      },
    },
    required: ['path'],
  },
  handler: async (args: { path: string }) => {
    // Placeholder implementation - replace with actual file reading
    console.log(`📖 Reading file: ${args.path}`);
    
    return {
      path: args.path,
      content: `File contents would be read from ${args.path}. This is a placeholder implementation.`,
      size: 1024,
      lastModified: new Date().toISOString(),
    };
  },
});

toolRegistry.registerTool({
  name: 'file_write',
  description: 'Write content to a file',
  parameters: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The file path to write to',
      },
      content: {
        type: 'string',
        description: 'The content to write',
      },
    },
    required: ['path', 'content'],
  },
  handler: async (args: { path: string; content: string }) => {
    // Placeholder implementation - replace with actual file writing
    console.log(`✍️ Writing to file: ${args.path}`);
    
    return {
      path: args.path,
      bytesWritten: args.content.length,
      success: true,
      timestamp: new Date().toISOString(),
    };
  },
});

toolRegistry.registerTool({
  name: 'execute_command',
  description: 'Execute a system command',
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The command to execute',
      },
      workingDirectory: {
        type: 'string',
        description: 'The working directory for the command',
        default: '.',
      },
    },
    required: ['command'],
  },
  handler: async (args: { command: string; workingDirectory?: string }) => {
    // Placeholder implementation - replace with actual command execution
    console.log(`⚡ Executing command: ${args.command}`);
    
    return {
      command: args.command,
      workingDirectory: args.workingDirectory || '.',
      output: `Command "${args.command}" executed successfully. This is a placeholder implementation.`,
      exitCode: 0,
      duration: 100,
    };
  },
});