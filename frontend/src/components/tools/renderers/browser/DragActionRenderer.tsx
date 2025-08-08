'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMove, FiCheck, FiX, FiArrowRight } from 'react-icons/fi';
import { BrowserShell } from '../BrowserShell';
import { ToolResultContentPart } from '../EnhancedToolResultRenderer';

interface DragActionRendererProps {
  part: ToolResultContentPart;
  onAction?: (action: string, data: any) => void;
}

/**
 * Specialized renderer for drag and drop actions
 * Shows drag path with animated arrows and source/target indicators
 */
export const DragActionRenderer: React.FC<DragActionRendererProps> = ({ part }) => {
  const { toolResult, toolInput } = part;
  const [sourcePosition, setSourcePosition] = useState<{ x: number; y: number } | null>(null);
  const [targetPosition, setTargetPosition] = useState<{ x: number; y: number } | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const screenshot = toolResult?.screenshot || toolInput?.screenshot;
  const status = toolResult?.status || 'success';
  const sourceSelector = toolInput?.sourceSelector || toolInput?.source || '';
  const targetSelector = toolInput?.targetSelector || toolInput?.target || '';

  useEffect(() => {
    if (toolResult) {
      // Extract source and target coordinates
      const { sourceX, sourceY, targetX, targetY, startX, startY, endX, endY } = toolResult;
      
      const srcX = sourceX || startX;
      const srcY = sourceY || startY;
      const tgtX = targetX || endX;
      const tgtY = targetY || endY;

      if (typeof srcX === 'number' && typeof srcY === 'number') {
        setSourcePosition({ x: srcX, y: srcY });
      }
      
      if (typeof tgtX === 'number' && typeof tgtY === 'number') {
        setTargetPosition({ x: tgtX, y: tgtY });
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
              alt="Drag action screenshot"
              className="w-full h-auto object-contain"
              onLoad={handleImageLoad}
            />

            {/* Drag visualization */}
            {sourcePosition && targetPosition && imageSize && (
              <>
                {/* Source indicator */}
                <motion.div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${(sourcePosition.x / imageSize.width) * 100}%`,
                    top: `${(sourcePosition.y / imageSize.height) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10,
                  }}
                >
                  <motion.div
                    className="absolute rounded-full border-2 border-green-500"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{
                      width: '24px',
                      height: '24px',
                      top: '-12px',
                      left: '-12px',
                      backgroundColor: 'rgba(34, 197, 94, 0.2)',
                    }}
                  />
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                    <div className="bg-green-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      Source
                    </div>
                  </div>
                </motion.div>

                {/* Target indicator */}
                <motion.div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${(targetPosition.x / imageSize.width) * 100}%`,
                    top: `${(targetPosition.y / imageSize.height) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10,
                  }}
                >
                  <motion.div
                    className="absolute rounded-full border-2 border-blue-500"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                    style={{
                      width: '24px',
                      height: '24px',
                      top: '-12px',
                      left: '-12px',
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    }}
                  />
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      Target
                    </div>
                  </div>
                </motion.div>

                {/* Animated drag path */}
                <svg
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  style={{ zIndex: 5 }}
                >
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="#8b5cf6"
                      />
                    </marker>
                  </defs>
                  <motion.path
                    d={`M ${(sourcePosition.x / imageSize.width) * 100}% ${(sourcePosition.y / imageSize.height) * 100}% 
                        Q ${((sourcePosition.x + targetPosition.x) / 2 / imageSize.width) * 100}% ${((sourcePosition.y + targetPosition.y) / 2 / imageSize.height) * 100 - 5}% 
                        ${(targetPosition.x / imageSize.width) * 100}% ${(targetPosition.y / imageSize.height) * 100}%`}
                    stroke="#8b5cf6"
                    strokeWidth="3"
                    strokeDasharray="8,4"
                    fill="none"
                    markerEnd="url(#arrowhead)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                  />
                </svg>

                {/* Moving element animation */}
                <motion.div
                  className="absolute pointer-events-none"
                  initial={{
                    left: `${(sourcePosition.x / imageSize.width) * 100}%`,
                    top: `${(sourcePosition.y / imageSize.height) * 100}%`,
                  }}
                  animate={{
                    left: `${(targetPosition.x / imageSize.width) * 100}%`,
                    top: `${(targetPosition.y / imageSize.height) * 100}%`,
                  }}
                  transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
                  style={{ transform: 'translate(-50%, -50%)', zIndex: 15 }}
                >
                  <motion.div
                    className="w-6 h-6 bg-purple-500 rounded-lg shadow-lg"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, ease: "linear" }}
                  />
                </motion.div>
              </>
            )}
          </div>
        </BrowserShell>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200/50 dark:border-gray-700/30 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-purple-50/80 dark:bg-purple-900/20 border-b border-purple-100/50 dark:border-purple-800/30 flex items-center">
          <FiMove className="text-purple-600 dark:text-purple-400 mr-2.5" size={18} />
          <div className="font-medium text-purple-700 dark:text-purple-300">Drag & Drop</div>
          <div className={`ml-auto flex items-center space-x-2 ${
            status === 'success' ? 'text-green-600' : 'text-red-600'
          }`}>
            {status === 'success' ? <FiCheck size={16} /> : <FiX size={16} />}
            <span className="text-xs font-medium capitalize">{status}</span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Source and Target elements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sourceSelector && (
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  Source Element
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/90 font-mono text-xs p-2 rounded-md border border-gray-100/50 dark:border-gray-700/30 overflow-x-auto">
                  {sourceSelector}
                </div>
              </div>
            )}

            {targetSelector && (
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  Target Element
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/90 font-mono text-xs p-2 rounded-md border border-gray-100/50 dark:border-gray-700/30 overflow-x-auto">
                  {targetSelector}
                </div>
              </div>
            )}
          </div>

          {/* Drag operation summary */}
          {sourceSelector && targetSelector && (
            <div className="bg-purple-50/50 dark:bg-purple-900/10 p-3 rounded-lg border border-purple-100/30 dark:border-purple-800/20">
              <div className="flex items-center justify-center space-x-3 text-sm">
                <span className="text-green-700 dark:text-green-300 font-medium">Source</span>
                <FiArrowRight className="text-purple-600 dark:text-purple-400" />
                <span className="text-blue-700 dark:text-blue-300 font-medium">Target</span>
              </div>
            </div>
          )}

          {/* Coordinates if available */}
          {sourcePosition && targetPosition && (
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-100/50 dark:border-green-800/30">
                <div className="font-medium text-green-700 dark:text-green-300 mb-1">Source Position</div>
                <div className="font-mono text-green-800 dark:text-green-200">
                  x: {sourcePosition.x}, y: {sourcePosition.y}
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100/50 dark:border-blue-800/30">
                <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">Target Position</div>
                <div className="font-mono text-blue-800 dark:text-blue-200">
                  x: {targetPosition.x}, y: {targetPosition.y}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};