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

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiExternalLink, FiGlobe, FiCopy, FiCheck } from 'react-icons/fi';
import { BrowserShell } from './BrowserShell';
import { ToolResultContentPart } from './EnhancedToolResultRenderer';
import { CodeEditor } from './CodeEditor';

interface BrowserResultRendererProps {
  part: ToolResultContentPart;
  onAction?: (action: string, data: any) => void;
}

/**
 * Renders browser navigation and page content results with improved UI
 *
 * Design improvements:
 * - Enhanced browser shell with realistic browser chrome
 * - Better visual hierarchy and content spacing
 * - Quick action buttons for URL interaction
 * - Proper content formatting with support for different content types
 * - Smooth animations for state changes
 */
export const BrowserResultRenderer: React.FC<BrowserResultRendererProps> = ({ part }) => {
  const { toolResult, toolInput } = part;
  const [copied, setCopied] = useState(false);

  // Extract data from toolResult
  const url = toolResult?.url || toolInput?.url || '';
  const content = toolResult?.content || toolResult?.text || '';
  const title = toolResult?.title || toolInput?.title || url?.split('/').pop() || 'Browser Result';
  const screenshot = toolResult?.screenshot || toolResult?.currentScreenshot || null;

  const displayTitle = title;

  if (!url && !content && !screenshot) {
    return <div className="text-gray-500 italic">Browser result is empty</div>;
  }

  const copyUrl = () => {
    if (url) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Extract URL from text content if it's in the format "Navigated to URL"
  const extractUrlFromContent = () => {
    if (typeof content === 'string' && content.includes('Navigated to ')) {
      const lines = content.split('\n');
      const firstLine = lines[0] || '';
      return firstLine.replace('Navigated to ', '').trim();
    }
    return url || '';
  };

  // Extract content from text after URL line
  const extractContentFromText = () => {
    if (typeof content === 'string' && content.includes('Navigated to ')) {
      const lines = content.split('\n');
      return lines.slice(1).join('\n');
    }
    return content;
  };

  const extractedUrl = extractUrlFromContent();
  const extractedContent = extractContentFromText();

  const shouldUseMarkdownEditor = part.toolName === 'browser_get_markdown';

  return (
    <div className="space-y-4">
      <div className="mb-4">
        {/* URL actions bar */}
        {extractedUrl && (
          <div className="mb-4 flex items-center">
            <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-800/80 rounded-lg text-sm border border-gray-100/30 dark:border-gray-700/20 flex items-center overflow-hidden">
              <FiGlobe className="flex-shrink-0 text-gray-400 dark:text-gray-500 mr-2" size={16} />
              <span className="truncate text-gray-700 dark:text-gray-300 mr-2">{extractedUrl}</span>
            </div>
            <div className="flex ml-2 gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={copyUrl}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200/50 dark:border-gray-700/30"
                title="Copy URL"
              >
                {copied ? <FiCheck size={18} className="text-green-500" /> : <FiCopy size={18} />}
              </motion.button>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href={extractedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-800/30 transition-colors border border-purple-200/50 dark:border-purple-800/30"
                title="Open in new tab"
              >
                <FiExternalLink size={18} />
              </motion.a>
            </div>
          </div>
        )}

        {/* Content with enhanced browser shell */}
        <BrowserShell title={displayTitle} url={extractedUrl}>
          <div className="bg-white dark:bg-gray-800 px-5 min-h-[200px] max-h-[70vh] overflow-auto border-t border-gray-100/30 dark:border-gray-700/20">
            {screenshot && (
              <div className="py-4">
                <img
                  src={screenshot}
                  alt="Browser Screenshot"
                  className="w-full h-auto rounded-md"
                />
              </div>
            )}

            {(typeof extractedContent === 'string') && extractedContent ? (
              shouldUseMarkdownEditor ? (
                <div className="py-4">
                  <CodeEditor
                    code={extractedContent}
                    language="markdown"
                    fileName="content.md"
                    showLineNumbers={true}
                    maxHeight="500px"
                    readOnly={true}
                    fontSize={13}
                  />
                </div>
              ) : (
                <div className="prose dark:prose-invert prose-sm max-w-none py-4">
                  <div className="whitespace-pre-wrap">{extractedContent}</div>
                </div>
              )
            ) : (
              !screenshot && (
                <pre className="text-sm whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100/30 dark:border-gray-700/20 overflow-x-auto">
                  {JSON.stringify(extractedContent, null, 2)}
                </pre>
              )
            )}
          </div>
        </BrowserShell>
      </div>
    </div>
  );
};