'use client';

import React, { useEffect, useRef, useState } from 'react';
import hljs from 'highlight.js';
import { FiCopy, FiCheck, FiFile } from 'react-icons/fi';

// Import highlight.js styles
import 'highlight.js/styles/github-dark.css';

interface CodeEditorProps {
  code: string;
  language: string;
  fileName?: string;
  showLineNumbers?: boolean;
  maxHeight?: string;
  className?: string;
}

/**
 * Professional code editor component with syntax highlighting
 * Based on UI-TARS CodeEditor using highlight.js
 */
export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  language,
  fileName = 'code.txt',
  showLineNumbers = true,
  maxHeight = '60vh',
  className = '',
}) => {
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const [lineCount, setLineCount] = useState(0);

  useEffect(() => {
    if (codeRef.current && code) {
      // Apply syntax highlighting
      const highlightedCode = hljs.highlight(code, { language: language }).value;
      codeRef.current.innerHTML = highlightedCode;
      
      // Count lines
      const lines = code.split('\n').length;
      setLineCount(lines);
    }
  }, [code, language]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const getLanguageBadge = () => {
    const languageColors: Record<string, string> = {
      python: 'bg-blue-500',
      javascript: 'bg-yellow-500',
      typescript: 'bg-blue-600',
      bash: 'bg-green-500',
      shell: 'bg-green-500',
      java: 'bg-orange-500',
      go: 'bg-cyan-500',
      rust: 'bg-orange-600',
      cpp: 'bg-purple-500',
      c: 'bg-gray-500',
    };

    const color = languageColors[language] || 'bg-gray-400';
    
    return (
      <span className={`px-2 py-0.5 rounded-sm text-xs font-medium text-white ${color}`}>
        {language.toUpperCase()}
      </span>
    );
  };

  return (
    <div className={`code-editor-container rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>
      {/* Editor header with file info */}
      <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* macOS-style controls */}
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm"></div>
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
          </div>
          
          <div className="flex items-center space-x-2">
            <FiFile size={14} className="text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{fileName}</span>
            {getLanguageBadge()}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* File stats */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {lineCount} lines • {code.length} chars
          </div>
          
          {/* Copy button */}
          <button
            onClick={copyToClipboard}
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Copy code"
          >
            {copied ? <FiCheck size={14} className="text-green-500" /> : <FiCopy size={14} />}
          </button>
        </div>
      </div>

      {/* Code content */}
      <div 
        className="relative overflow-auto"
        style={{ maxHeight }}
      >
        <div className="flex">
          {/* Line numbers */}
          {showLineNumbers && (
            <div className="bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 px-3 py-4 text-xs font-mono text-gray-500 dark:text-gray-400 select-none min-w-[3rem] text-right">
              {code.split('\n').map((_, index) => (
                <div key={index} className="leading-6">
                  {index + 1}
                </div>
              ))}
            </div>
          )}

          {/* Code area */}
          <div className="flex-1 bg-gray-900 text-gray-100">
            <pre className="p-4 overflow-x-auto">
              <code
                ref={codeRef}
                className={`hljs language-${language} text-sm leading-6`}
                style={{ background: 'transparent' }}
              />
            </pre>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Language: {language}</span>
            <span>Size: {(code.length / 1024).toFixed(1)} KB</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>UTF-8</span>
            <span>LF</span>
          </div>
        </div>
      </div>
    </div>
  );
};