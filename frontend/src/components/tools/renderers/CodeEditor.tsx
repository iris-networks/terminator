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
    <div className={`code-editor-container ${className}`}>
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
  );
};