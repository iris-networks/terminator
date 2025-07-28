'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCode, FiCopy, FiCheck, FiX, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { EnhancedToolResultRenderer } from './renderers/EnhancedToolResultRenderer';

/**
 * Parse tool result data, handling both JSON strings and objects
 */
const parseToolResult = (toolResult: any) => {
  if (typeof toolResult === 'string') {
    try {
      return JSON.parse(toolResult);
    } catch (e) {
      console.error('Failed to parse toolResult:', e);
      return toolResult;
    }
  }
  return toolResult;
};

interface ToolResultData {
  messageId: string;
  toolName: string;
  toolInput: any;
  toolResult: any;
  status: 'success' | 'error';
  timestamp: string;
  fullJson: string;
  enhancedContent?: any[]; // For enhanced tool results
}

interface ToolResultViewerProps {
  socket: any;
  onHasResults?: (hasResults: boolean) => void;
  clearResults?: boolean;
}

export const ToolResultViewer: React.FC<ToolResultViewerProps> = ({ socket, onHasResults, clearResults }) => {
  const [toolResults, setToolResults] = useState<ToolResultData[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!socket) {
      console.log('ToolResultViewer: No socket available');
      return; 
    }

    console.log('ToolResultViewer: Setting up socket listeners');

    const handleEnhancedToolResult = (data: { messageId: string; content: any[] }) => {
      console.log('🔧 ToolResultViewer: Received enhanced tool result:', data);
      
      // Convert enhanced format to ToolResultData format
      if (data.content && data.content.length > 0) {
        data.content.forEach((contentPart: any) => {
          const toolResultData: ToolResultData = {
            messageId: data.messageId,
            toolName: contentPart.toolName || contentPart.name || 'unknown',
            toolInput: contentPart.toolInput || {},
            toolResult: contentPart.toolResult || {},
            status: contentPart.status || 'success',
            timestamp: contentPart.timestamp || new Date().toISOString(),
            fullJson: contentPart.fullJson || JSON.stringify(contentPart, null, 2),
            enhancedContent: data.content
          };

          setToolResults(prev => {
            const newResults = [...prev, toolResultData];
            console.log('🔧 ToolResultViewer: Updated tool results count:', newResults.length);
            onHasResults?.(newResults.length > 0);
            return newResults;
          });
        });
      }
    };

    // Listen only to enhanced tool results
    socket.on('enhanced_tool_result', handleEnhancedToolResult);

    return () => {
      console.log('ToolResultViewer: Cleaning up socket listeners');
      socket.off('enhanced_tool_result', handleEnhancedToolResult);
    };
  }, [socket, onHasResults]);

  useEffect(() => {
    onHasResults?.(toolResults.length > 0);
  }, [toolResults.length, onHasResults]);

  // Clear results when clearResults prop changes
  useEffect(() => {
    if (clearResults) {
      setToolResults([]);
      setCopiedIndex(null);
    }
  }, [clearResults]);

  const copyToClipboard = async (json: string, index: number) => {
    try {
      await navigator.clipboard.writeText(json);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleClearResults = () => {
    setToolResults([]);
    onHasResults?.(false);
  };

  if (toolResults.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-6">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-4">
            <FiCode className="text-gray-400" size={20} />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Tool Results
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tool execution results will appear here as JSON
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <FiCode className="mr-2 text-gray-600 dark:text-gray-400" size={16} />
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">
            Tool Results ({toolResults.length})
          </h3>
        </div>
        <button
          onClick={handleClearResults}
          className="text-xs px-3 py-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {toolResults.map((result, index) => (
            <motion.div
              key={`${result.messageId}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Tool Header */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    result.status === 'success' 
                      ? 'bg-green-500' 
                      : 'bg-red-500'
                  }`} />
                  <span className="font-mono text-sm font-medium text-gray-800 dark:text-gray-200">
                    {result.toolName}
                  </span>
                  {result.status === 'success' ? (
                    <FiCheckCircle className="ml-2 text-green-500" size={14} />
                  ) : (
                    <FiXCircle className="ml-2 text-red-500" size={14} />
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                  <button
                    onClick={() => copyToClipboard(result.fullJson, index)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    title="Copy JSON"
                  >
                    {copiedIndex === index ? (
                      <FiCheck size={12} className="text-green-500" />
                    ) : (
                      <FiCopy size={12} />
                    )}
                  </button>
                </div>
              </div>

              {/* Enhanced Content */}
              <div className="p-3">
                {result.enhancedContent ? (
                  <EnhancedToolResultRenderer 
                    content={result.enhancedContent.map(content => ({
                      ...content,
                      toolResult: parseToolResult(content.toolResult)
                    }))}
                    className="enhanced-tool-result"
                  />
                ) : (
                  <EnhancedToolResultRenderer 
                    content={[{
                      type: result.toolName,
                      toolName: result.toolName,
                      toolInput: result.toolInput,
                      toolResult: parseToolResult(result.toolResult),
                      status: result.status,
                      timestamp: result.timestamp,
                      fullJson: result.fullJson
                    }]}
                    className="enhanced-tool-result"
                  />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};