'use client';

import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { FiCopy, FiCheck, FiFile } from 'react-icons/fi';

interface CodeEditorProps {
  code: string;
  language: string;
  fileName?: string;
  showLineNumbers?: boolean;
  maxHeight?: string;
  className?: string;
  readOnly?: boolean;
  fontSize?: number;
}

/**
 * Professional Monaco Editor component with VS Code-like experience
 * Based on UI-TARS CodeEditor with Monaco Editor integration
 */
export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  language,
  fileName = 'code.txt',
  showLineNumbers = true,
  maxHeight = '60vh',
  className = '',
  readOnly = true,
  fontSize = 14,
}) => {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);
  const lineCount = code.split('\n').length;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Map common language aliases to Monaco supported languages
  const getMonacoLanguage = (lang: string): string => {
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'py': 'python',
      'sh': 'shell',
      'bash': 'shell',
      'zsh': 'shell',
      'yml': 'yaml',
      'md': 'markdown',
    };
    return languageMap[lang.toLowerCase()] || lang.toLowerCase();
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

      {/* Monaco Editor */}
      <div 
        className="relative overflow-hidden"
        style={{ height: maxHeight }}
      >
        <Editor
          height={maxHeight}
          language={getMonacoLanguage(language)}
          value={code}
          theme={theme === 'dark' ? 'vs-dark' : 'vs'}
          options={{
            readOnly,
            fontSize,
            lineNumbers: showLineNumbers ? 'on' : 'off',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            contextmenu: false,
            selectOnLineNumbers: true,
            roundedSelection: false,
            cursorStyle: 'line',
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              useShadows: false,
              verticalHasArrows: false,
              horizontalHasArrows: false,
            },
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
          }}
          loading={
            <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
              <div className="text-gray-500 dark:text-gray-400">Loading editor...</div>
            </div>
          }
        />
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