'use client';

import React, { useState, useCallback } from 'react';
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
  showHeader?: boolean;
}

/**
 * Professional Monaco Editor component with VS Code-like experience
 * Modern CodeEditor with Monaco Editor integration
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
  showHeader = true,
}) => {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const lineCount = code.split('\n').length;

  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    console.log('Monaco editor loaded successfully');
    setEditorError(null);
  }, []);

  const handleEditorError = useCallback((error: any) => {
    console.error('Monaco editor error:', error);
    setEditorError('Failed to load Monaco editor');
  }, []);

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

  // Fallback component when Monaco Editor fails to load
  const FallbackEditor = () => (
    <div className="relative">
      <textarea
        value={code}
        readOnly={readOnly}
        className={`w-full p-4 font-mono text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          theme === 'dark' 
            ? 'bg-gray-900 text-gray-100 border-gray-700' 
            : 'bg-white text-gray-900 border-gray-300'
        }`}
        style={{ 
          height: maxHeight,
          fontSize: `${fontSize}px`,
          lineHeight: '1.5'
        }}
      />
      <div className="absolute top-2 right-2 flex items-center space-x-2">
        {getLanguageBadge()}
        <button
          onClick={copyToClipboard}
          className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
            copied ? 'text-green-500' : 'text-gray-500'
          }`}
          title="Copy code"
        >
          {copied ? <FiCheck size={16} /> : <FiCopy size={16} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className={`code-editor-container ${className}`}>
      {editorError ? (
        <FallbackEditor />
      ) : (
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
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <div className="text-gray-500 dark:text-gray-400">Loading editor...</div>
              </div>
            </div>
          }
          onMount={handleEditorDidMount}
          onValidate={(markers) => {
            if (markers.length > 0) {
              console.log('Monaco validation markers:', markers);
            }
          }}
        />
      )}
    </div>
  );
};