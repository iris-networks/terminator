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
import React from 'react';
import { FiSearch, FiClock, FiExternalLink } from 'react-icons/fi';
import { ToolResultContentPart } from './EnhancedToolResultRenderer';

interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  publishedDate?: string;
}

interface WebSearchData {
  query: string;
  results: WebSearchResult[];
  totalResults: number;
  searchTime?: number;
  source?: string;
}

interface WebSearchResultRendererProps {
  part: ToolResultContentPart;
  onAction?: (action: string, data: any) => void;
}

export const WebSearchResultRenderer: React.FC<WebSearchResultRendererProps> = ({ part }) => {
  // The part.toolResult contains the search result data
  let toolResult = part.toolResult || part;
  
  // Handle case where toolResult is a string (JSON)
  if (typeof toolResult === 'string') {
    try {
      toolResult = JSON.parse(toolResult);
    } catch (e) {
      console.error('Failed to parse tool result JSON:', e);
    }
  }

  // The data structure can be:
  // 1. Direct search data: { query, results, totalResults, ... }
  // 2. Nested: { result: { query, results, totalResults, ... }, args: {...} }
  const searchData: WebSearchData = toolResult.result || toolResult || {};
  const args = part.toolInput || toolResult.args || {};
  
  // Safety checks
  if (!searchData.results || !Array.isArray(searchData.results)) {
    return (
      <div className="text-red-500 p-4">
        <p>Invalid web search data format</p>
        <div className="text-xs mt-2">
          <p>Expected structure: toolResult.result.results[]</p>
          <p>Received:</p>
          <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
            {JSON.stringify({ toolResult, part }, null, 2)}
          </pre>
        </div>
      </div>
    );
  }
  
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  return (
    <div className="web-search-result-container">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center space-x-3">
            {/* macOS-style controls */}
            <div className="flex space-x-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm"></div>
              <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
            </div>
            
            <div className="flex items-center space-x-2">
              <FiSearch size={14} className="text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Web Search: "{args.query || searchData.query || 'Unknown query'}"
              </span>
              <span className="px-2 py-0.5 rounded-sm text-xs font-medium text-white bg-blue-500">
                WEB
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {searchData.totalResults || searchData.results.length} results
            </div>
            {searchData.source && (
              <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-900/30 text-gray-400">
                {searchData.source}
              </span>
            )}
          </div>
        </div>

        {/* Search results content */}
        <div className="bg-white dark:bg-gray-900 p-4 space-y-4 max-h-[60vh] overflow-auto">
          {searchData.results.map((item, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-medium leading-tight">
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline flex items-center gap-1"
                    >
                      {item.title}
                      <FiExternalLink size={12} className="flex-shrink-0" />
                    </a>
                  </h3>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {getDomainFromUrl(item.url)}
                  </span>
                  {item.publishedDate && (
                    <>
                      <FiClock size={12} />
                      <span>{formatDate(item.publishedDate)}</span>
                    </>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {item.snippet}
                </p>
              </div>
            </div>
          ))}
        </div>

      {/* Status bar */}
      <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Format: Web Search</span>
            <span>Results: {searchData.results?.length || 0}</span>
            {searchData.searchTime && (
              <span>Time: {(searchData.searchTime / 1000).toFixed(2)}s</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span>UTF-8</span>
            <span>Web Results</span>
          </div>
        </div>
      </div>
    </div>
  );
};