'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMonitor, FiGlobe, FiFileText, FiTerminal, FiCode, FiSearch } from 'react-icons/fi';
import { EnhancedToolResultRenderer } from '@/components/tools/renderers/EnhancedToolResultRenderer';
import { useToolResults } from './hooks/useToolResults';
import { usePlayback } from './hooks/usePlayback';
import { PlaybackControls } from './components/PlaybackControls';
import { ToolResultData } from './types';

export const WorkspacePanel: React.FC = () => {
  const { toolResults, setToolResults } = useToolResults();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  const {
    currentFrame,
    isPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    togglePlayback,
    goToPreviousFrame,
    goToNextFrame,
    goToFirstFrame,
    goToLastFrame,
    setCurrentFrame
  } = usePlayback(toolResults.length);

  // Auto-advance to newest result when new results come in
  useEffect(() => {
    if (toolResults.length > 0) {
      setCurrentFrame(toolResults.length - 1);
    }
  }, [toolResults.length, setCurrentFrame]);

  const parseToolResult = (toolResult: any) => {
    if (typeof toolResult === 'string') {
      try {
        return JSON.parse(toolResult);
      } catch {
        return toolResult;
      }
    }
    return toolResult;
  };

  const copyToClipboard = async (json: string, index: number) => {
    try {
      await navigator.clipboard.writeText(json);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (toolResults.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center text-gray-500 dark:text-gray-400 max-w-md">
          <div className="flex justify-center gap-4 mb-6">
            <FiGlobe className="text-3xl text-blue-400" />
            <FiFileText className="text-3xl text-green-400" />
            <FiTerminal className="text-3xl text-purple-400" />
            <FiCode className="text-3xl text-orange-400" />
            <FiSearch className="text-3xl text-cyan-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">Computer Interface</h2>
          <p className="text-sm leading-relaxed">Web browsing, file operations, code execution, and search results will appear here</p>
        </div>
      </div>
    );
  }

  const currentResult = toolResults[currentFrame];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FiMonitor className="text-blue-500" />
            Computer
          </h2>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {toolResults.length} result{toolResults.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentFrame}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="flex-1 overflow-auto p-4">
              <EnhancedToolResultRenderer
                content={[{
                  type: 'tool_result',
                  toolName: currentResult.toolName,
                  toolInput: currentResult.toolInput,
                  toolResult: parseToolResult(currentResult.toolResult),
                  status: currentResult.status,
                  timestamp: currentResult.timestamp
                }]}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom playback controls */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
        <PlaybackControls
          currentFrame={currentFrame}
          totalFrames={toolResults.length}
          isPlaying={isPlaying}
          playbackSpeed={playbackSpeed}
          onTogglePlayback={togglePlayback}
          onPreviousFrame={goToPreviousFrame}
          onNextFrame={goToNextFrame}
          onFirstFrame={goToFirstFrame}
          onLastFrame={goToLastFrame}
          onSpeedChange={setPlaybackSpeed}
        />
      </div>
    </div>
  );
};