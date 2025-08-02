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

interface ClickActionRendererProps {
  part: ToolResultContentPart;
  onAction?: (action: string, data: any) => void;
}

/**
 * Specialized renderer for click actions (single, double, right-click)
 * Shows click location with appropriate animations
 */
export const ClickActionRenderer: React.FC<ClickActionRendererProps> = ({ part }) => {
  const { toolResult, toolInput, toolName } = part;
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const screenshot = toolResult?.screenshot || toolInput?.screenshot;
  const status = toolResult?.status || 'success';
  const element = toolInput?.element || toolInput?.selector || '';
  
  // Determine click type
  const clickType = toolName?.includes('double') ? 'double' : 
                   toolName?.includes('right') ? 'right' : 'single';

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

  const getClickTypeInfo = () => {
    switch (clickType) {
      case 'double':
        return { 
          label: 'Double Click', 
          color: 'purple',
          animation: { duration: 0.3, repeat: 1 }
        };
      case 'right':
        return { 
          label: 'Right Click', 
          color: 'orange',
          animation: { duration: 0.5, repeat: 0 }
        };
      default:
        return { 
          label: 'Click', 
          color: 'blue',
          animation: { duration: 0.4, repeat: 0 }
        };
    }
  };

  const clickInfo = getClickTypeInfo();

  return (
    <div className="space-y-4">
      {screenshot && (
        <BrowserShell>
          <div className="relative">
            <img
              ref={imageRef}
              src={screenshot}
              alt="Click action screenshot"
              className="w-full h-auto object-contain"
              onLoad={handleImageLoad}
            />

            {/* Click indicator */}
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
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ zIndex: 10, transform: 'translate(-50%, -50%)' }}
              >
                {/* Click ripple effect */}
                <motion.div
                  className="absolute rounded-full border-2"
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 3, opacity: 0 }}
                  transition={{
                    duration: clickInfo.animation.duration,
                    repeat: clickInfo.animation.repeat,
                    ease: "easeOut"
                  }}
                  style={{
                    width: '20px',
                    height: '20px',
                    top: '-10px',
                    left: '-10px',
                    borderColor: `rgb(var(--color-${clickInfo.color}-500))`,
                  }}
                />

                {/* Center dot */}
                <motion.div
                  className="absolute rounded-full"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    width: '8px',
                    height: '8px',
                    top: '-4px',
                    left: '-4px',
                    backgroundColor: `rgb(var(--color-${clickInfo.color}-600))`,
                    boxShadow: `0 0 10px rgb(var(--color-${clickInfo.color}-400))`,
                  }}
                />

                {/* Cursor icon */}
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '-12px',
                    filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))',
                  }}
                >
                  <path
                    d="M5 3L19 12L12 13L9 20L5 3Z"
                    fill="white"
                    stroke="#000000"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>
            )}
          </div>
        </BrowserShell>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200/50 dark:border-gray-700/30 shadow-sm overflow-hidden">
        <div className={`px-4 py-3 bg-${clickInfo.color}-50/80 dark:bg-${clickInfo.color}-900/20 border-b border-${clickInfo.color}-100/50 dark:border-${clickInfo.color}-800/30 flex items-center`}>
          <FiMousePointer className={`text-${clickInfo.color}-600 dark:text-${clickInfo.color}-400 mr-2.5`} size={18} />
          <div className={`font-medium text-${clickInfo.color}-700 dark:text-${clickInfo.color}-300`}>
            {clickInfo.label}
          </div>
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
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Click Coordinates</div>
              <div className={`bg-${clickInfo.color}-50 dark:bg-${clickInfo.color}-900/20 p-2 rounded-lg border border-${clickInfo.color}-100/50 dark:border-${clickInfo.color}-800/30`}>
                <span className={`text-${clickInfo.color}-800 dark:text-${clickInfo.color}-200 font-mono text-sm`}>
                  x: {mousePosition.x}, y: {mousePosition.y}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};