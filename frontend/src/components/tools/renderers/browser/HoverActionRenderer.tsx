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

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiMousePointer, FiCheck, FiX } from 'react-icons/fi';
import { BrowserShell } from '../BrowserShell';
import { ToolResultContentPart } from '../EnhancedToolResultRenderer';

interface HoverActionRendererProps {
  part: ToolResultContentPart;
  onAction?: (action: string, data: any) => void;
}

/**
 * Specialized renderer for hover actions
 * Shows hover position with subtle hover animations
 */
export const HoverActionRenderer: React.FC<HoverActionRendererProps> = ({ part }) => {
  const { toolResult, toolInput } = part;
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const screenshot = toolResult?.screenshot || toolInput?.screenshot;
  const status = toolResult?.status || 'success';
  const element = toolInput?.element || toolInput?.selector || '';

  useEffect(() => {
    if (toolResult) {
      const { x, y, startX, startY } = toolResult;
      const coordX = startX || x;
      const coordY = startY || y;

      if (typeof coordX === 'number' && typeof coordY === 'number') {
        setMousePosition({ x: coordX, y: coordY });
      }
    }
  }, [toolResult]);

  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageSize({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      });
    }
  };

  return (
    <div className="space-y-4">
      {screenshot && (
        <BrowserShell>
          <div className="relative">
            <img
              ref={imageRef}
              src={screenshot}
              alt="Hover action screenshot"
              className="w-full h-auto object-contain"
              onLoad={handleImageLoad}
            />

            {/* Hover indicator */}
            {mousePosition && imageSize && (
              <motion.div
                className="absolute pointer-events-none"
                initial={{
                  left: `${(mousePosition.x / imageSize.width) * 100}%`,
                  top: `${(mousePosition.y / imageSize.height) * 100}%`,
                }}
                animate={{
                  left: `${(mousePosition.x / imageSize.width) * 100}%`,
                  top: `${(mousePosition.y / imageSize.height) * 100}%`,
                }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{ zIndex: 10, transform: 'translate(-50%, -50%)' }}
              >
                {/* Soft glow effect for hover */}
                <motion.div
                  className="absolute rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    width: '30px',
                    height: '30px',
                    top: '-15px',
                    left: '-15px',
                    background: 'radial-gradient(circle, rgba(147, 51, 234, 0.4) 0%, rgba(147, 51, 234, 0) 70%)',
                    border: '1px solid rgba(147, 51, 234, 0.3)',
                  }}
                />

                {/* Cursor icon with subtle animation */}
                <motion.svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  animate={{
                    y: [0, -2, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '-12px',
                    filter: 'drop-shadow(0px 2px 6px rgba(147, 51, 234, 0.3))',
                  }}
                >
                  <path
                    d="M5 3L19 12L12 13L9 20L5 3Z"
                    fill="white"
                    stroke="#9333ea"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </motion.svg>

                {/* Hover state indicator */}
                <motion.div
                  className="absolute rounded-full bg-purple-500"
                  animate={{
                    scale: [0.8, 1, 0.8],
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    width: '4px',
                    height: '4px',
                    top: '-2px',
                    left: '-2px',
                    boxShadow: '0 0 8px 2px rgba(147, 51, 234, 0.5)',
                  }}
                />
              </motion.div>
            )}
          </div>
        </BrowserShell>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200/50 dark:border-gray-700/30 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-purple-50/80 dark:bg-purple-900/20 border-b border-purple-100/50 dark:border-purple-800/30 flex items-center">
          <motion.div
            animate={{
              x: [0, 2, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <FiMousePointer className="text-purple-600 dark:text-purple-400 mr-2.5" size={18} />
          </motion.div>
          <div className="font-medium text-purple-700 dark:text-purple-300">Hover Action</div>
          <div className={`ml-auto flex items-center space-x-2 ${
            status === 'success' ? 'text-green-600' : 'text-red-600'
          }`}>
            {status === 'success' ? <FiCheck size={16} /> : <FiX size={16} />}
            <span className="text-xs font-medium capitalize">{status}</span>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {element && (
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Element</div>
              <div className="bg-gray-50 dark:bg-gray-800/90 font-mono text-xs p-2 rounded-md border border-gray-100/50 dark:border-gray-700/30 overflow-x-auto">
                {element}
              </div>
            </div>
          )}

          {mousePosition && (
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hover Position</div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg border border-purple-100/50 dark:border-purple-800/30">
                <span className="text-purple-800 dark:text-purple-200 font-mono text-sm">
                  x: {mousePosition.x}, y: {mousePosition.y}
                </span>
              </div>
            </div>
          )}

          <div className="bg-purple-50/50 dark:bg-purple-900/10 p-3 rounded-lg border border-purple-100/30 dark:border-purple-800/20">
            <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">
              Mouse cursor is hovering over the element
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};