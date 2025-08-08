// Common types for tool responses and configurations

export interface ToolResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export interface BrowserTabInfo {
  id: string;
  url: string;
  title: string;
  active: boolean;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  publishedDate: string;
}

export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
}

export interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode: number;
}