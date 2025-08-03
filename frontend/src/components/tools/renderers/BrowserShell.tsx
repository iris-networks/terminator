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
import { FiLock, FiGlobe, FiRefreshCw } from 'react-icons/fi';

interface BrowserShellProps {
  children: React.ReactNode;
  title?: string;
  url?: string;
  className?: string;
}

/**
 * BrowserShell - A component that mimics a browser window with improved visuals
 *
 * Design improvements:
 * - Modern browser chrome styling with authentic address bar
 * - Refined control buttons with hover effects
 * - Subtle shadows and borders for enhanced depth perception
 * - Realistic URL formatting with https indicator
 * - Tab-like interface for better visual fidelity
 */
export const BrowserShell: React.FC<BrowserShellProps> = ({
  children,
  title = 'Browser',
  url = '',
  className = '',
}) => {
  // Format URL for display
  const displayUrl = url || '';
  const isSecure = displayUrl.startsWith('https://');

  // Extract domain for tab display
  const getDomain = (url: string) => {
    try {
      if (url.startsWith('http')) {
        const domain = new URL(url).hostname;
        return domain || title;
      }
    } catch (e) {}
    return title;
  };

  const domain = getDomain(displayUrl);

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200/70 dark:border-gray-700/40 shadow-sm ${className}`}
    >
      {/* Browser toolbar with modern styling */}
      <div className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200/60 dark:border-gray-700/40">
        {/* Address bar with controls */}
        <div className="flex items-center px-4 py-3">
          {/* macOS-style Traffic Light Controls */}
          <div className="flex space-x-1.5 mr-4">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="w-3 h-3 rounded-full bg-red-400 dark:bg-red-500 border border-red-500/20 dark:border-red-400/20 shadow-sm cursor-pointer" 
            />
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="w-3 h-3 rounded-full bg-yellow-400 dark:bg-yellow-500 border border-yellow-500/20 dark:border-yellow-400/20 shadow-sm cursor-pointer" 
            />
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="w-3 h-3 rounded-full bg-green-400 dark:bg-green-500 border border-green-500/20 dark:border-green-400/20 shadow-sm cursor-pointer" 
            />
          </div>

          {/* URL bar with secure indicator and refresh button */}
          <div className="flex-1 bg-white dark:bg-gray-700 rounded-lg flex items-center px-3 py-2 text-xs text-gray-700 dark:text-gray-200 border border-gray-200/60 dark:border-gray-600/40 group hover:border-gray-300/60 dark:hover:border-gray-500/40 transition-all duration-200 shadow-sm">
            <div className="flex items-center w-full">
              <div className="flex items-center mr-2">
                {isSecure ? (
                  <FiLock className="mr-1.5 text-green-500 dark:text-green-400" size={12} />
                ) : (
                  <FiGlobe className="mr-1.5 text-gray-400 dark:text-gray-500" size={12} />
                )}
              </div>
              <span className="truncate font-mono flex-1">{displayUrl}</span>
              
              {/* Refresh Button */}
              <motion.button
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-all duration-200"
                title="Refresh"
              >
                <FiRefreshCw size={12} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="overflow-auto max-h-[100vh]">{children}</div>
    </div>
  );
};