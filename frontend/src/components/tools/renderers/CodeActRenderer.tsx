'use client';

import React, { useState } from 'react';
import { FiCode, FiCopy, FiCheck, FiTerminal, FiClock, FiPackage, FiSave, FiPlay, FiCheckCircle, FiXCircle, FiCpu } from 'react-icons/fi';
import { ToolResultContentPart } from './EnhancedToolResultRenderer';

interface CodeActRendererProps {
  part: ToolResultContentPart;
  onAction?: (action: string, data: any) => void;
}

/**
 * Specialized renderer for CodeAct tool results
 * Handles Node.js, Python, and Shell code execution results with enhanced UI
 * Based on UI-TARS CodeAct renderer patterns
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
    <div className="codeact-result">
      {/* Code execution header */}
      <div className={`rounded-lg overflow-hidden border shadow-sm ${
        success 
          ? 'border-green-200 dark:border-green-800' 
          : 'border-red-200 dark:border-red-800'
      }`}>
        {/* Header with execution info */}
        <div className={`px-4 py-3 border-b border-gray-200 dark:border-gray-700 ${langInfo.bgColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{langInfo.icon}</span>
                <div className="flex items-center space-x-2">
                  <FiCode className={langInfo.color} size={16} />
                  <span className={`text-sm font-medium ${langInfo.color}`}>
                    {langInfo.label} Execution
                  </span>
                  {success ? (
                    <FiCheckCircle className="text-green-500" size={14} />
                  ) : (
                    <FiXCircle className="text-red-500" size={14} />
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {duration > 0 && (
                <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                  <FiClock size={12} />
                  <span>{formatDuration(duration)}</span>
                </div>
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(part.timestamp || Date.now()).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Code section */}
        <div className="bg-white dark:bg-gray-800">
          {/* Code header */}
          <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FiTerminal size={14} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Source Code
                </span>
                {filename && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {filename}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {memoryKey && (
                  <div className="flex items-center space-x-1 text-xs text-purple-600 dark:text-purple-400">
                    <FiSave size={12} />
                    <span>{memoryKey}</span>
                  </div>
                )}
                <button
                  onClick={copyCode}
                  className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Copy code"
                >
                  {copied ? <FiCheck size={12} className="text-green-500" /> : <FiCopy size={12} />}
                </button>
              </div>
            </div>
          </div>

          {/* Code content */}
          <div className="bg-gray-900 p-4">
            <pre className="text-sm font-mono text-gray-100 whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {code}
            </pre>
          </div>
        </div>

        {/* Output section */}
        {(output || error) && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            {/* Output header */}
            <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FiPlay size={14} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Execution Result
                  </span>
                  {exitCode !== undefined && (
                    <span className={`px-2 py-0.5 rounded-sm text-xs font-medium ${
                      exitCode === 0 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                      exit {exitCode}
                    </span>
                  )}
                </div>
                
                <button
                  onClick={() => setShowOutput(!showOutput)}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  {showOutput ? 'Hide' : 'Show'} Output
                </button>
              </div>
            </div>

            {/* Output content */}
            {showOutput && (
              <div className="bg-black overflow-auto max-h-[60vh]">
                {/* Standard output */}
                {output && (
                  <div className="p-4">
                    <div className="text-xs text-green-400 mb-2 font-medium">STDOUT:</div>
                    <pre className="text-sm font-mono text-gray-100 whitespace-pre-wrap leading-relaxed">
                      {output}
                    </pre>
                  </div>
                )}
                
                {/* Error output */}
                {error && (
                  <div className="p-4 border-t border-gray-800">
                    <div className="text-xs text-red-400 mb-2 font-medium">STDERR:</div>
                    <pre className="text-sm font-mono text-red-300 whitespace-pre-wrap leading-relaxed">
                      {error}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer with metadata */}
        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <FiCpu size={12} />
                <span>{langInfo.label}</span>
              </div>
              {workspace && (
                <div className="flex items-center space-x-1">
                  <FiPackage size={12} />
                  <span className="font-mono truncate max-w-32">{workspace.split('/').pop()}</span>
                </div>
              )}
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                success 
                  ? 'bg-green-900/30 text-green-400' 
                  : 'bg-red-900/30 text-red-400'
              }`}>
                {success ? 'SUCCESS' : 'FAILED'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {code && (
                <span>{code.split('\\n').length} lines</span>
              )}
              <span>{langInfo.language.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};