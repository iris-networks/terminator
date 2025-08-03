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
import { FiCode, FiCopy, FiCheck, FiTerminal, FiClock, FiPackage, FiSave, FiPlay, FiCheckCircle, FiXCircle, FiCpu } from 'react-icons/fi';
import { ToolResultContentPart } from './EnhancedToolResultRenderer';
import { CodeEditor } from './CodeEditor';

interface CodeActRendererProps {
  part: ToolResultContentPart;
  onAction?: (action: string, data: any) => void;
}

/**
 * Specialized renderer for CodeAct tool results
 * Handles Node.js, Python, and Shell code execution results with enhanced UI
 * Modern CodeAct renderer patterns
 */
export const CodeActRenderer: React.FC<CodeActRendererProps> = ({ part }) => {
  const [copied, setCopied] = useState(false);
  const [showOutput, setShowOutput] = useState(true);

  // Extract CodeAct data from the tool result
  const toolResult = part.toolResult || {};
  const toolInput = part.toolInput || {};
  const type = toolResult.type || part.toolName || 'code_execution';
  const success = toolResult.success !== false;
  const output = toolResult.output || '';
  const error = toolResult.error || '';
  const code = toolInput.code || '';
  const duration = toolResult.duration || 0;
  const filename = toolResult.filename || 'code';
  const workspace = toolResult.workspace || '';
  const memoryKey = toolResult.memoryKey;
  const exitCode = toolResult.exitCode;

  // Get language and icon based on type
  const getLanguageInfo = (type: string) => {
    switch (type) {
      case 'node_codeact':
        return {
          language: 'javascript',
          label: 'Node.js',
          icon: '🟨',
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
        };
      case 'python_codeact':
        return {
          language: 'python',
          label: 'Python',
          icon: '🐍',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20'
        };
      case 'shell_codeact':
        return {
          language: 'bash',
          label: 'Shell',
          icon: '🔧',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20'
        };
      default:
        return {
          language: 'text',
          label: 'Code',
          icon: '💻',
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20'
        };
    }
  };

  const langInfo = getLanguageInfo(type);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="codeact-result space-y-4">
      {/* Code content */}
      <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <CodeEditor
          code={code}
          language={langInfo.language}
          fileName={filename}
          showLineNumbers={true}
          maxHeight="300px"
          readOnly={true}
          fontSize={13}
        />
      </div>

      {/* Output section */}
      {(output || error) && (
        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="bg-black p-4">
            {output && (
              <pre className="text-sm font-mono text-green-400 whitespace-pre-wrap leading-relaxed">
                {output}
              </pre>
            )}
            {error && (
              <pre className="text-sm font-mono text-red-400 whitespace-pre-wrap leading-relaxed">
                {error}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};