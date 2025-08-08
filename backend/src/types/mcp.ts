import { z } from 'zod';

export enum MCPTransportType {
  STDIO = 'stdio',
  SSE = 'sse'
}

export const MCPStdioConfigSchema = z.object({
  type: z.literal(MCPTransportType.STDIO),
  command: z.string().describe('Command to execute the MCP server'),
  args: z.array(z.string()).optional().default([]).describe('Arguments for the command'),
  env: z.record(z.string()).optional().describe('Environment variables for the server'),
  cwd: z.string().optional().describe('Working directory for the server')
});

export const MCPSSEConfigSchema = z.object({
  type: z.literal(MCPTransportType.SSE),
  url: z.string().url().describe('Server-sent events URL for the MCP server'),
  headers: z.record(z.string()).optional().describe('Additional headers for the connection'),
  timeout: z.number().optional().default(30000).describe('Connection timeout in milliseconds')
});

export const MCPServerConfigSchema = z.object({
  name: z.string().describe('Unique name for the MCP server'),
  description: z.string().optional().describe('Description of the MCP server capabilities'),
  enabled: z.boolean().default(true).describe('Whether the server is enabled'),
  priority: z.number().default(50).describe('Priority for tool selection (higher = more priority)'),
  timeout: z.number().optional().default(10000).describe('Tool execution timeout in milliseconds'),
  transport: z.union([MCPStdioConfigSchema, MCPSSEConfigSchema]).describe('Transport configuration')
});

export const MCPConfigSchema = z.object({
  enabled: z.boolean().default(true).describe('Enable MCP integration globally'),
  defaultTimeout: z.number().default(10000).describe('Default timeout for tool execution'),
  maxConcurrentConnections: z.number().default(5).describe('Maximum concurrent MCP connections'),
  retryAttempts: z.number().default(3).describe('Number of retry attempts for failed connections'),
  servers: z.array(MCPServerConfigSchema).default([]).describe('List of MCP servers to connect to')
});

export type MCPStdioConfig = z.infer<typeof MCPStdioConfigSchema>;
export type MCPSSEConfig = z.infer<typeof MCPSSEConfigSchema>;
export type MCPServerConfig = z.infer<typeof MCPServerConfigSchema>;
export type MCPConfig = z.infer<typeof MCPConfigSchema>;

export interface MCPServerConnection {
  name: string;
  config: MCPServerConfig;
  client?: any;
  tools: Record<string, any>;
  connected: boolean;
  lastError?: string;
  connectionTime?: Date;
  toolCount: number;
}

export interface MCPToolCall {
  serverId: string;
  toolName: string;
  parameters: Record<string, any>;
}

export interface MCPToolResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  serverId: string;
  toolName: string;
}

export interface MCPManagerStatus {
  enabled: boolean;
  totalServers: number;
  connectedServers: number;
  totalTools: number;
  connections: MCPServerConnection[];
  lastUpdate: Date;
}