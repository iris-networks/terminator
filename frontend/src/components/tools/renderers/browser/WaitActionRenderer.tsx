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

import React from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiCheck, FiX } from 'react-icons/fi';
import { BrowserShell } from '../BrowserShell';
import { ToolResultContentPart } from '../EnhancedToolResultRenderer';

interface WaitActionRendererProps {
  part: ToolResultContentPart;
  onAction?: (action: string, data: any) => void;
}

/**
 * Specialized renderer for wait/timeout actions
 * Shows waiting duration, condition, and result
 */
export const WaitActionRenderer: React.FC<WaitActionRendererProps> = ({ part }) => {
  const { toolResult, toolInput } = part;
  const screenshot = toolResult?.screenshot || toolInput?.screenshot;
  const duration = toolInput?.duration || toolInput?.timeout || toolResult?.duration;
  const condition = toolInput?.condition || toolInput?.for || toolResult?.condition;
  const status = toolResult?.status || 'success';

  return (
    <div className="space-y-4">
      {screenshot && (
        <BrowserShell>
          <img 
            src={screenshot} 
            alt="Wait action screenshot" 
            className="w-full h-auto object-contain"
          />
        </BrowserShell>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200/50 dark:border-gray-700/30 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-amber-50/80 dark:bg-amber-900/20 border-b border-amber-100/50 dark:border-amber-800/30 flex items-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mr-2.5"
          >
            <FiClock className="text-amber-600 dark:text-amber-400" size={18} />
          </motion.div>
          <div className="font-medium text-amber-700 dark:text-amber-300">Wait Action</div>
          <div className={`ml-auto flex items-center space-x-2 ${
            status === 'success' ? 'text-green-600' : 'text-red-600'
          }`}>
            {status === 'success' ? <FiCheck size={16} /> : <FiX size={16} />}
            <span className="text-xs font-medium capitalize">{status}</span>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {duration && (
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</div>
              <div className="flex items-center space-x-2">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-100/50 dark:border-amber-800/30"
                >
                  <span className="text-amber-800 dark:text-amber-200 font-mono font-medium">
                    {duration}s
                  </span>
                </motion.div>
              </div>
            </div>
          )}

          {condition && (
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Wait Condition</div>
              <div className="bg-gray-50 dark:bg-gray-800/90 p-3 rounded-lg border border-gray-100/50 dark:border-gray-700/30">
                <div className="text-sm text-gray-700 dark:text-gray-300">{condition}</div>
              </div>
            </div>
          )}

          {!duration && !condition && (
            <div className="text-center py-4">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-amber-600 dark:text-amber-400"
              >
                Waiting for page to load...
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};