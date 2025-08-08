'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiEye, FiMousePointer, FiType, FiChevronsRight } from 'react-icons/fi';
import { BrowserShell } from './BrowserShell';
import { ToolResultContentPart } from './EnhancedToolResultRenderer';

interface BrowserControlRendererProps {
  part: ToolResultContentPart;
  onAction?: (action: string, data: any) => void;
}

/**
 * Specialized renderer for browser_vision_control tool results
 *
 * This renderer displays:
 * 1. The screenshot from the environment input
 * 2. A mouse cursor overlay showing the action point
 * 3. The thought process of the agent
 * 4. The step being performed
 * 5. The specific action taken
 *
 * Design improvements:
 * - Shows screenshot at the top for better visual context
 * - Displays enhanced mouse cursor with artistic animations
 * - Uses browser shell wrapper for consistent styling
 * - Applies smooth transitions for mouse movements
 * - Features visually engaging click animations
 */
export const BrowserControlRenderer: React.FC<BrowserControlRendererProps> = ({
  part,
  onAction,
}) => {
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Extract the visual operation details from the part
  const { toolResult, toolInput } = part;
  const thought = toolResult?.thought || toolInput?.thought || '';
  const step = toolResult?.step || toolInput?.step || toolResult?.action || '';
  const action = toolResult?.action || toolInput?.action || '';
  const status = toolResult?.status || 'success';
  const screenshot = toolResult?.screenshot || toolResult?.image || toolInput?.screenshot;

  // Get coordinates from tool result
  useEffect(() => {
    if (toolResult) {
      const { startX, startY, x, y } = toolResult;
      const coordX = startX || x;
      const coordY = startY || y;

      // Set position if coordinates are valid
      if (typeof coordX === 'number' && typeof coordY === 'number') {
        setMousePosition({
          x: coordX,
          y: coordY,
        });
      }
    }
  }, [toolResult]);

  // Handler to get image dimensions when loaded
  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageSize({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      });
    }
  };

  // If no valid data, show a placeholder
  if (!thought && !step && !action && !screenshot) {
    return <div className="text-gray-500 italic">Browser control details unavailable</div>;
  }

  return (
    <div className="space-y-4">
      {/* Screenshot section - moved to the top */}
      {screenshot && (
        <div>
          <BrowserShell className="mb-4">
            <div className="relative">
              <img
                ref={imageRef}
                src={screenshot}
                alt="Browser Screenshot"
                className="w-full h-auto object-contain"
                onLoad={handleImageLoad}
              />

              {/* Enhanced mouse cursor overlay */}
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
                  style={{
                    zIndex: 10,
                  }}
                >
                  <div className="relative">
                    {/* Enhanced cursor icon with shadow effect */}
                    <svg
                      width="36"
                      height="36"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{
                        filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))',
                        transform: 'translate(0px, 2px)',
                      }}
                    >
                      <defs>
                        <linearGradient id="cursorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="white" />
                          <stop offset="100%" stopColor="#f5f5f5" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M5 3L19 12L12 13L9 20L5 3Z"
                        fill="url(#cursorGradient)"
                        stroke="#000000"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                    </svg>

                    {/* Artistic pulse effect for click actions */}
                    {action && action.includes('click') && (
                      <>
                        {/* Multiple layered ripple effects */}
                        <motion.div
                          className="absolute rounded-full"
                          initial={{ opacity: 0.8, scale: 0 }}
                          animate={{ opacity: 0, scale: 2.5 }}
                          transition={{
                            duration: 1.5,
                            ease: 'easeOut',
                            repeat: Infinity,
                          }}
                          style={{
                            top: '-8px',
                            left: '-8px',
                            width: '24px',
                            height: '24px',
                            background:
                              'radial-gradient(circle, rgba(99,102,241,0.6) 0%, rgba(99,102,241,0) 70%)',
                            border: '1px solid rgba(99,102,241,0.3)',
                          }}
                        />
                        <motion.div
                          className="absolute rounded-full"
                          initial={{ opacity: 0.9, scale: 0 }}
                          animate={{ opacity: 0, scale: 2 }}
                          transition={{
                            duration: 1.2,
                            ease: 'easeOut',
                            delay: 0.2,
                            repeat: Infinity,
                          }}
                          style={{
                            top: '-6px',
                            left: '-6px',
                            width: '20px',
                            height: '20px',
                            background:
                              'radial-gradient(circle, rgba(99,102,241,0.8) 0%, rgba(99,102,241,0) 70%)',
                            border: '1px solid rgba(99,102,241,0.5)',
                          }}
                        />
                        {/* Central highlight dot */}
                        <motion.div
                          className="absolute rounded-full bg-white"
                          initial={{ opacity: 1, scale: 0.5 }}
                          animate={{ opacity: 0.8, scale: 1 }}
                          transition={{
                            duration: 0.7,
                            repeat: Infinity,
                            repeatType: 'reverse',
                          }}
                          style={{
                            top: '2px',
                            left: '2px',
                            width: '4px',
                            height: '4px',
                            boxShadow: '0 0 10px 2px rgba(255,255,255,0.7)',
                          }}
                        />
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </BrowserShell>
        </div>
      )}

      {/* Visual operation details card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200/50 dark:border-gray-700/30 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-100/50 dark:border-gray-700/30 flex items-center">
          <FiMousePointer className="text-gray-600 dark:text-gray-400 mr-2.5" size={18} />
          <div className="font-medium text-gray-700 dark:text-gray-300">GUI Agent Operation</div>
          {status && (
            <div
              className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
                status === 'success'
                  ? 'bg-green-100/80 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : 'bg-red-100/80 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              }`}
            >
              {status === 'success' ? 'Success' : 'Failed'}
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          {/* Thought process */}
          {thought && (
            <div className="space-y-1">
              <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                <FiEye className="mr-2 text-purple-500/70 dark:text-purple-400/70" size={14} />
                Thought
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 pl-6 border-l-2 border-purple-100 dark:border-purple-900/30">
                {thought}
              </div>
            </div>
          )}

          {/* Step */}
          {step && (
            <div className="space-y-1">
              <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                <FiChevronsRight
                  className="mr-2 text-blue-500/70 dark:text-blue-400/70"
                  size={14}
                />
                Action
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 pl-6 border-l-2 border-blue-100 dark:border-blue-900/30">
                {step}
              </div>
            </div>
          )}

          {/* Action command */}
          {action && (
            <div className="space-y-1">
              <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                <FiType className="mr-2 text-gray-500/70 dark:text-gray-400/70" size={14} />
                Action Command
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/90 font-mono text-xs p-2 rounded-md border border-gray-100/50 dark:border-gray-700/30 overflow-x-auto">
                {action}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};