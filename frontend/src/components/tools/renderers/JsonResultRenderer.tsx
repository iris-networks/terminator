'use client';

import React, { useState } from 'react';
import { FiCopy, FiCheck, FiCode } from 'react-icons/fi';
import { ToolResultContentPart } from './EnhancedToolResultRenderer';

interface JsonResultRendererProps {
  part: ToolResultContentPart;
  onAction?: (action: string, data: any) => void;
}

/**
 * JSON syntax highlighting function
 */
const highlightJson = (jsonString: string) => {
  return jsonString.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'text-white';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-blue-400'; // property names
        } else {
          cls = 'text-green-400'; // strings
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-purple-400'; // booleans
      } else if (/null/.test(match)) {
        cls = 'text-red-400'; // null
      } else if (/^-?\d+/.test(match)) {
        cls = 'text-yellow-400'; // numbers
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
};

/**
 * Renders JSON content with syntax highlighting and formatting
 * Based on UI-TARS JsonContent component
 */
export const JsonResultRenderer: React.FC<JsonResultRendererProps> = ({ part }) => {
  const [copied, setCopied] = useState(false);
  
  // Extract JSON data from different possible structures
  let jsonData: any;
  let jsonString: string;

  if (part.fullJson) {
    jsonString = part.fullJson;
    try {
      jsonData = JSON.parse(jsonString);
    } catch {
      jsonData = part.fullJson;
    }
  } else if (part.toolResult) {
    jsonData = part.toolResult;
    jsonString = JSON.stringify(jsonData, null, 2);
  } else {
    jsonData = part;
    jsonString = JSON.stringify(jsonData, null, 2);
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy JSON:', err);
    }
  };

  const highlightedJson = highlightJson(jsonString);

  return (
    <div className="json-result-container">
      {/* JSON viewer with professional styling */}
      <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Header */}
        <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* macOS-style controls */}
            <div className="flex space-x-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm"></div>
              <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
            </div>
            
            <div className="flex items-center space-x-2">
              <FiCode size={14} className="text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {part.toolName ? `${part.toolName} Result` : 'JSON Output'}
              </span>
              <span className="px-2 py-0.5 rounded-sm text-xs font-medium text-white bg-orange-500">
                JSON
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* File stats */}
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {jsonString.split('\n').length} lines • {jsonString.length} chars
            </div>
            
            {/* Copy button */}
            <button
              onClick={copyToClipboard}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="Copy JSON"
            >
              {copied ? <FiCheck size={14} className="text-green-500" /> : <FiCopy size={14} />}
            </button>
          </div>
        </div>

        {/* JSON content */}
        <div className="bg-gray-900 text-gray-100 overflow-auto max-h-[60vh]">
          <div className="flex">
            {/* Line numbers */}
            <div className="bg-gray-800 border-r border-gray-700 px-3 py-4 text-xs font-mono text-gray-500 select-none min-w-[3rem] text-right">
              {jsonString.split('\n').map((_, index) => (
                <div key={index} className="leading-6">
                  {index + 1}
                </div>
              ))}
            </div>

            {/* JSON content area */}
            <div className="flex-1 p-4">
              <pre 
                className="text-sm font-mono leading-6 overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: highlightedJson }}
              />
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span>Format: JSON</span>
              <span>Size: {(jsonString.length / 1024).toFixed(1)} KB</span>
              {part.status && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                  part.status === 'success' 
                    ? 'bg-green-900/30 text-green-400' 
                    : 'bg-red-900/30 text-red-400'
                }`}>
                  {part.status}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span>UTF-8</span>
              <span>Valid JSON</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};