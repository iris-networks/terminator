'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { FiCopy, FiCheck } from 'react-icons/fi';

interface SimpleCodeEditorProps {
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

export const SimpleCodeEditor: React.FC<SimpleCodeEditorProps> = ({
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
  const [MonacoEditor, setMonacoEditor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const loadMonaco = async () => {
      try {
        setIsLoading(true);
        
        // Set a shorter timeout for Monaco loading
        timeoutId = setTimeout(() => {
          console.warn('Monaco Editor loading timed out after 3 seconds, falling back to textarea');
          setLoadError(true);
          setIsLoading(false);
        }, 3000); // 3 second timeout

        // Configure Monaco Editor loader to use CDN with error handling
        const { loader } = await import('@monaco-editor/react');
        
        // Add error handler for loader
        loader.config({
          paths: {
            vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs'
          },
          'vs/nls': {
            availableLanguages: {
              '*': 'en'
            }
          }
        });

        const { default: Editor } = await import('@monaco-editor/react');
        
        clearTimeout(timeoutId);
        setMonacoEditor(() => Editor);
        setIsLoading(false);
        console.log('Monaco Editor loaded successfully');
      } catch (error) {
        console.error('Failed to load Monaco Editor:', error);
        clearTimeout(timeoutId);
        setLoadError(true);
        setIsLoading(false);
      }
    };

    loadMonaco();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
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

  // Fallback textarea component
  const FallbackEditor = () => (
    <div className="relative">
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          {getLanguageBadge()}
          <span className="text-sm text-gray-600 dark:text-gray-400">{fileName}</span>
        </div>
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
      <textarea
        value={code}
        readOnly={readOnly}
        className={`w-full p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 border-0 ${
          theme === 'dark' 
            ? 'bg-gray-900 text-gray-100' 
            : 'bg-white text-gray-900'
        }`}
        style={{ 
          height: maxHeight,
          fontSize: `${fontSize}px`,
          lineHeight: '1.5',
          minHeight: '200px'
        }}
      />
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900 rounded-lg border">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <div className="text-gray-500 dark:text-gray-400">Loading editor...</div>
        </div>
      </div>
    );
  }

  if (loadError || !MonacoEditor) {
    return <FallbackEditor />;
  }

  return (
    <div className={`code-editor-container border rounded-lg overflow-hidden ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center space-x-2">
            {getLanguageBadge()}
            <span className="text-sm text-gray-600 dark:text-gray-400">{fileName}</span>
          </div>
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
      )}
      <MonacoEditor
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
        onMount={(editor: any, monaco: any) => {
          console.log('Monaco editor loaded successfully');
        }}
      />
    </div>
  );
};