'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCode, FiCopy, FiCheck, FiX, FiTerminal, FiGlobe, FiSearch, FiFolder } from 'react-icons/fi';
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

export interface ToolResultData {
  messageId: string;
  toolName: string;
  toolInput: any;
  toolResult: any;
  status: 'success' | 'error';
  timestamp: string;
  fullJson: string;
  content?: any[]; // For tool results
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

    const handleToolResult = (data: { messageId: string; content: any[] }) => {
      console.log('🔧 ToolResultViewer: Received tool result:', data);
      
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
            content: data.content
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

    // Listen to tool results
    socket.on('tool_result', handleToolResult);

    return () => {
      console.log('ToolResultViewer: Cleaning up socket listeners');
      socket.off('tool_result', handleToolResult);
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

  // Get tool icon based on tool name
  const getToolIcon = (toolName: string) => {
    const iconMap: { [key: string]: { icon: React.ComponentType<any>, gradient: string } } = {
      'bash': { icon: FiTerminal, gradient: 'from-green-400 to-emerald-600' },
      'grep': { icon: FiSearch, gradient: 'from-blue-400 to-indigo-600' },
      'read': { icon: FiFolder, gradient: 'from-orange-400 to-amber-600' },
      'write': { icon: FiFolder, gradient: 'from-orange-400 to-amber-600' },
      'web_search': { icon: FiSearch, gradient: 'from-blue-400 to-indigo-600' },
      'web_fetch': { icon: FiGlobe, gradient: 'from-purple-400 to-pink-600' },
    };
    
    const toolKey = toolName.toLowerCase().replace(/[^a-z_]/g, '');
    return iconMap[toolKey] || { icon: FiCode, gradient: 'from-gray-400 to-gray-600' };
  };

  if (toolResults.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-8"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-accent-400 to-accent-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <FiCode className="text-white" size={24} />
          </div>
          <h3 className="text-xl font-display font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Tool Results
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
            Tool execution results will appear here with elegant visualizations
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Elegant Header */}
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
            <FiCode className="text-white" size={16} />
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-gray-800 dark:text-gray-200 truncate">
              Tool Results
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {toolResults.length} execution{toolResults.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleClearResults}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 rounded-lg transition-all duration-200 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/40 ml-4 flex-shrink-0"
        >
          Clear All
        </motion.button>
      </div>

      {/* Elegant Results Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-5">
          <AnimatePresence>
            {toolResults.map((result, index) => {
              const { icon: ToolIcon, gradient } = getToolIcon(result.toolName);
              
              return (
                <motion.div
                  key={`${result.messageId}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
                  exit={{ opacity: 0, y: -10 }}
                  whileHover={{ y: -2 }}
                  className="group"
                >
                  {/* Glass Card Effect */}
                  <div className="relative backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 rounded-2xl border border-gray-100/80 dark:border-gray-700/30 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                    {/* Status Indicator Bar */}
                    <div className={`h-1 w-full ${
                      result.status === 'success' 
                        ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                        : 'bg-gradient-to-r from-red-400 to-rose-500'
                    }`} />
                    
                    {/* Tool Header */}
                    <div className="flex items-center justify-between p-5 pb-4">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {/* Gradient Tool Icon */}
                        <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-sm flex-shrink-0`}>
                          <ToolIcon className="text-white" size={18} />
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-sm font-semibold text-gray-800 dark:text-gray-200 tracking-wide truncate">
                              {result.toolName}
                            </span>
                            {result.status === 'success' ? (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0"
                              >
                                <FiCheck className="text-white" size={12} />
                              </motion.div>
                            ) : (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0"
                              >
                                <FiX className="text-white" size={12} />
                              </motion.div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {new Date(result.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      
                      {/* Copy Button */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => copyToClipboard(result.fullJson, index)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100/60 dark:bg-gray-700/60 hover:bg-gray-200/80 dark:hover:bg-gray-600/80 rounded-xl transition-all duration-200 backdrop-blur-sm ml-3 flex-shrink-0"
                        title="Copy JSON"
                      >
                        {copiedIndex === index ? (
                          <FiCheck size={14} className="text-green-500" />
                        ) : (
                          <FiCopy size={14} />
                        )}
                      </motion.button>
                    </div>

                    {/* Tool Content with Enhanced Styling */}
                    <div className="px-5 pb-5">
                      <div className="bg-gray-50/60 dark:bg-gray-900/60 rounded-xl p-4 border border-gray-100/60 dark:border-gray-700/30">
                        {result.content ? (
                          <EnhancedToolResultRenderer 
                            content={result.content.map(content => ({
                              ...content,
                              toolResult: parseToolResult(content.toolResult)
                            }))}
                            className="tool-result-elegant"
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
                            className="tool-result-elegant"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};