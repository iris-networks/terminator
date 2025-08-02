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