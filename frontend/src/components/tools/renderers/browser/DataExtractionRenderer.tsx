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
import { FiDownload, FiCheck, FiX, FiCopy, FiEye } from 'react-icons/fi';
import { BrowserShell } from '../BrowserShell';
import { ToolResultContentPart } from '../EnhancedToolResultRenderer';
import { CodeEditor } from '../CodeEditor';

interface DataExtractionRendererProps {
  part: ToolResultContentPart;
  onAction?: (action: string, data: any) => void;
}

/**
 * Specialized renderer for data extraction actions
 * Shows extracted data with proper formatting and copy functionality
 */
export const DataExtractionRenderer: React.FC<DataExtractionRendererProps> = ({ part }) => {
  const { toolResult, toolInput } = part;
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'data' | 'raw'>('data');

  const screenshot = toolResult?.screenshot || toolInput?.screenshot;
  const status = toolResult?.status || 'success';
  const selector = toolInput?.selector || toolInput?.element || '';
  const extractedData = toolResult?.extractedData || toolResult?.data || toolResult?.text || toolResult?.content;
  const extractionType = toolInput?.type || 'text';

  const copyData = () => {
    const dataToCopy = typeof extractedData === 'string' 
      ? extractedData 
      : JSON.stringify(extractedData, null, 2);
    
    navigator.clipboard.writeText(dataToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderExtractedData = () => {
    if (!extractedData) return null;

    if (typeof extractedData === 'string') {
      return (
        <div className="space-y-2">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100/50 dark:border-blue-800/30">
            <div className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
              {extractedData}
            </div>
          </div>
        </div>
      );
    }

    if (Array.isArray(extractedData)) {
      return (
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Extracted {extractedData.length} items:
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {extractedData.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 dark:bg-gray-800/90 p-3 rounded-lg border border-gray-100/50 dark:border-gray-700/30"
              >
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {typeof item === 'string' ? item : JSON.stringify(item, null, 2)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gray-50 dark:bg-gray-800/90 rounded-lg border border-gray-100/50 dark:border-gray-700/30 overflow-hidden">
        <CodeEditor
          code={JSON.stringify(extractedData, null, 2)}
          language="json"
          fileName="extracted-data.json"
          showLineNumbers={true}
          maxHeight="300px"
          readOnly={true}
          fontSize={12}
        />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {screenshot && (
        <BrowserShell>
          <img 
            src={screenshot} 
            alt="Data extraction screenshot" 
            className="w-full h-auto object-contain"
          />
        </BrowserShell>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200/50 dark:border-gray-700/30 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-emerald-50/80 dark:bg-emerald-900/20 border-b border-emerald-100/50 dark:border-emerald-800/30 flex items-center">
          <FiDownload className="text-emerald-600 dark:text-emerald-400 mr-2.5" size={18} />
          <div className="font-medium text-emerald-700 dark:text-emerald-300">Data Extraction</div>
          <div className="ml-auto flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={copyData}
              className="p-1.5 rounded-lg bg-emerald-100/80 dark:bg-emerald-800/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200/80 dark:hover:bg-emerald-700/40 transition-colors"
              title="Copy extracted data"
            >
              {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
            </motion.button>
            <div className={`flex items-center space-x-2 ${
              status === 'success' ? 'text-green-600' : 'text-red-600'
            }`}>
              {status === 'success' ? <FiCheck size={16} /> : <FiX size={16} />}
              <span className="text-xs font-medium capitalize">{status}</span>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Extraction details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selector && (
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Selector</div>
                <div className="bg-gray-50 dark:bg-gray-800/90 font-mono text-xs p-2 rounded-md border border-gray-100/50 dark:border-gray-700/30 overflow-x-auto">
                  {selector}
                </div>
              </div>
            )}

            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Extraction Type</div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg border border-emerald-100/50 dark:border-emerald-800/30">
                <span className="text-emerald-800 dark:text-emerald-200 font-medium text-sm capitalize">
                  {extractionType}
                </span>
              </div>
            </div>
          </div>

          {/* Data tabs */}
          {extractedData && (
            <div>
              <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                <button
                  onClick={() => setActiveTab('data')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'data'
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <FiEye className="inline mr-2" size={14} />
                  Extracted Data
                </button>
                <button
                  onClick={() => setActiveTab('raw')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'raw'
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  Raw JSON
                </button>
              </div>

              <div className="min-h-[100px]">
                {activeTab === 'data' ? (
                  renderExtractedData()
                ) : (
                  <CodeEditor
                    code={JSON.stringify({ extractedData, selector, extractionType, status }, null, 2)}
                    language="json"
                    fileName="extraction-result.json"
                    showLineNumbers={true}
                    maxHeight="400px"
                    readOnly={true}
                    fontSize={12}
                  />
                )}
              </div>
            </div>
          )}

          {!extractedData && (
            <div className="text-center py-8">
              <div className="text-gray-500 dark:text-gray-400">
                No data was extracted
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};