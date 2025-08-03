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
'use client';

import React, { useState } from 'react';
import { FiCopy, FiCheck, FiInfo, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { ToolResultContentPart } from './EnhancedToolResultRenderer';

interface GenericResultRendererProps {
  part: ToolResultContentPart;
  onAction?: (action: string, data: any) => void;
}

/**
 * Generic result renderer for handling various content types
 * Modern GenericResultRenderer
 */
export const GenericResultRenderer: React.FC<GenericResultRendererProps> = ({ part }) => {
  const [copied, setCopied] = useState(false);

  // Determine what content to display
  const getDisplayContent = () => {
    if (part.fullJson) {
      return part.fullJson;
    }
    
    if (part.toolResult) {
      if (typeof part.toolResult === 'string') {
        return part.toolResult;
      }
      return JSON.stringify(part.toolResult, null, 2);
    }

    if (part.toolInput) {
      return JSON.stringify(part.toolInput, null, 2);
    }

    return JSON.stringify(part, null, 2);
  };

  const content = getDisplayContent();
  const toolName = part.toolName || part.name || 'Generic Tool';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  const getStatusIcon = () => {
    switch (part.status) {
      case 'success':
        return <FiCheckCircle className="text-green-500" size={16} />;
      case 'error':
        return <FiAlertCircle className="text-red-500" size={16} />;
      default:
        return <FiInfo className="text-blue-500" size={16} />;
    }
  };

  const getStatusColor = () => {
    switch (part.status) {
      case 'success':
        return 'border-green-200 dark:border-green-800';
      case 'error':
        return 'border-red-200 dark:border-red-800';
      default:
        return 'border-gray-200 dark:border-gray-700';
    }
  };

  const getHeaderColor = () => {
    switch (part.status) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20';
      default:
        return 'bg-gray-50 dark:bg-gray-800';
    }
  };

  return (
    <div className="generic-result-container">
      {/* Generic result viewer with professional styling */}
      <div className={`rounded-lg overflow-hidden border ${getStatusColor()} shadow-sm`}>
        {/* Header */}
        <div className={`${getHeaderColor()} px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between`}>
          <div className="flex items-center space-x-3">
            {/* Status indicator */}
            {getStatusIcon()}
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {toolName}
              </span>
              <span className="px-2 py-0.5 rounded-sm text-xs font-medium text-white bg-gray-500">
                RESULT
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Timestamp */}
            {part.timestamp && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(part.timestamp).toLocaleTimeString()}
              </div>
            )}
            
            {/* Copy button */}
            <button
              onClick={copyToClipboard}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="Copy content"
            >
              {copied ? <FiCheck size={14} className="text-green-500" /> : <FiCopy size={14} />}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-gray-50 dark:bg-gray-900 overflow-auto max-h-[60vh]">
          <div className="p-4">
            <pre className="text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
              {content}
            </pre>
          </div>
        </div>

        {/* Status bar */}
        <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span>Type: {part.type || 'generic'}</span>
              <span>Size: {content.length} chars</span>
              {part.status && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                  part.status === 'success' 
                    ? 'bg-green-900/30 text-green-400' 
                    : part.status === 'error'
                    ? 'bg-red-900/30 text-red-400'
                    : 'bg-gray-900/30 text-gray-400'
                }`}>
                  {part.status}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span>UTF-8</span>
              <span>RAW</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};