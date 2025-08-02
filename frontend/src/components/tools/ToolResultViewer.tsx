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

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCode, FiCopy, FiCheck, FiX, FiTerminal, FiGlobe, FiSearch, FiFolder, FiChevronLeft, FiChevronRight, FiPlay, FiPause, FiSkipBack, FiSkipForward } from 'react-icons/fi';
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
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000);

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
      setCurrentFrame(0);
      setIsPlaying(false);
    }
  }, [clearResults]);

  // Auto-advance to newest result
  useEffect(() => {
    if (toolResults.length > 0) {
      setCurrentFrame(toolResults.length - 1);
    }
  }, [toolResults.length]);

  // Playback functionality
  useEffect(() => {
    if (!isPlaying || toolResults.length === 0) return;

    const interval = setInterval(() => {
      setCurrentFrame(prev => {
        if (prev >= toolResults.length - 1) {
          setIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, toolResults.length, playbackSpeed]);

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
    setCurrentFrame(0);
    setIsPlaying(false);
    onHasResults?.(false);
  };

  // Player controls
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const goToPreviousFrame = () => {
    setCurrentFrame(prev => Math.max(0, prev - 1));
    setIsPlaying(false);
  };

  const goToNextFrame = () => {
    setCurrentFrame(prev => Math.min(toolResults.length - 1, prev + 1));
    setIsPlaying(false);
  };

  const goToFirstFrame = () => {
    setCurrentFrame(0);
    setIsPlaying(false);
  };

  const goToLastFrame = () => {
    setCurrentFrame(toolResults.length - 1);
    setIsPlaying(false);
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

  const currentResult = toolResults[currentFrame];
  const { icon: ToolIcon, gradient } = getToolIcon(currentResult.toolName);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-sm">
            <FiCode className="text-white" size={16} />
          </div>
          <div>
            <h3 className="font-display font-semibold text-gray-800 dark:text-gray-200 text-sm">
              Tool Results
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {toolResults.length > 0 ? `Frame ${currentFrame + 1} of ${toolResults.length}` : '0 executions'}
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleClearResults}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 rounded-lg transition-all duration-200"
        >
          Clear All
        </motion.button>
      </div>

      {/* Single Frame Display - Video Player Style */}
      <div className="flex-1 overflow-hidden p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={`frame-${currentFrame}`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-full group"
          >
            <div className="relative backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 rounded-2xl border border-accent-500/50 shadow-lg shadow-accent-500/10 transition-all duration-300 overflow-hidden h-full flex flex-col">
              {/* Status Indicator Bar */}
              <div className={`h-1 w-full ${
                currentResult.status === 'success' 
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                  : 'bg-gradient-to-r from-red-400 to-rose-500'
              }`} />
              
              {/* Tool Header */}
              <div className="flex items-center justify-between p-5 pb-4 flex-shrink-0">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-sm flex-shrink-0`}>
                    <ToolIcon className="text-white" size={18} />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-semibold text-gray-800 dark:text-gray-200 tracking-wide truncate">
                        {currentResult.toolName}
                      </span>
                      {currentResult.status === 'success' ? (
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
                      {new Date(currentResult.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => copyToClipboard(currentResult.fullJson, currentFrame)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100/60 dark:bg-gray-700/60 hover:bg-gray-200/80 dark:hover:bg-gray-600/80 rounded-xl transition-all duration-200 backdrop-blur-sm ml-3 flex-shrink-0"
                  title="Copy JSON"
                >
                  {copiedIndex === currentFrame ? (
                    <FiCheck size={14} className="text-green-500" />
                  ) : (
                    <FiCopy size={14} />
                  )}
                </motion.button>
              </div>

              {/* Tool Content - Scrollable */}
              <div className="flex-1 overflow-y-auto px-5 pb-5">
                <div className="bg-gray-50/60 dark:bg-gray-900/60 rounded-xl p-4 border border-gray-100/60 dark:border-gray-700/30">
                  {currentResult.content && currentResult.content.length > 0 ? (
                    <EnhancedToolResultRenderer 
                      content={currentResult.content.map(content => ({
                        ...content,
                        toolResult: parseToolResult(content.toolResult)
                      }))}
                      className="tool-result-elegant"
                    />
                  ) : (
                    <EnhancedToolResultRenderer 
                      content={[{
                        type: currentResult.toolName,
                        toolName: currentResult.toolName,
                        toolInput: currentResult.toolInput,
                        toolResult: parseToolResult(currentResult.toolResult),
                        status: currentResult.status,
                        timestamp: currentResult.timestamp,
                        fullJson: currentResult.fullJson
                      }]}
                      className="tool-result-elegant"
                    />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Player Controls */}
      {toolResults.length > 1 && (
        <div className="border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Frame Counter */}
              <div className="text-sm text-gray-600 dark:text-gray-300 font-mono">
                Frame {currentFrame + 1} of {toolResults.length}
              </div>

              {/* Player Controls */}
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToFirstFrame}
                  disabled={currentFrame === 0}
                  className="p-2 text-gray-600 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="First frame"
                >
                  <FiSkipBack size={16} />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToPreviousFrame}
                  disabled={currentFrame === 0}
                  className="p-2 text-gray-600 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous frame"
                >
                  <FiChevronLeft size={16} />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={togglePlayback}
                  className="p-3 text-white bg-accent-500 hover:bg-accent-600 rounded-lg transition-all duration-200 shadow-sm"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <FiPause size={18} /> : <FiPlay size={18} />}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToNextFrame}
                  disabled={currentFrame === toolResults.length - 1}
                  className="p-2 text-gray-600 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next frame"
                >
                  <FiChevronRight size={16} />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToLastFrame}
                  disabled={currentFrame === toolResults.length - 1}
                  className="p-2 text-gray-600 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Last frame"
                >
                  <FiSkipForward size={16} />
                </motion.button>
              </div>

              {/* Speed Control */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Speed:</span>
                <select 
                  value={playbackSpeed} 
                  onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                  className="text-xs bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-gray-600 dark:text-gray-300"
                >
                  <option value={500}>2x</option>
                  <option value={1000}>1x</option>
                  <option value={1500}>0.7x</option>
                  <option value={2000}>0.5x</option>
                </select>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="relative">
                <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent-500 transition-all duration-300 ease-out"
                    style={{ width: `${((currentFrame + 1) / toolResults.length) * 100}%` }}
                  />
                </div>
                {/* Frame markers */}
                <div className="absolute top-0 left-0 w-full h-1 flex">
                  {toolResults.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentFrame(index);
                        setIsPlaying(false);
                      }}
                      className="flex-1 h-3 -mt-1 hover:bg-accent-300/30 transition-colors duration-200"
                      title={`Frame ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};