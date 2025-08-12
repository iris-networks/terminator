'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiPlay, FiCode, FiTerminal, FiCopy, FiCheck } from 'react-icons/fi';
import { SimpleCodeEditor } from './SimpleCodeEditor';
import { ToolResultContentPart } from './EnhancedToolResultRenderer';

interface ScriptResultRendererProps {
  part: ToolResultContentPart;
  onAction?: (action: string, data: any) => void;
}

/**
 * Language to file extension mapping
 */
const LANGUAGE_EXTENSIONS: Record<string, string> = {
  javascript: 'js',
  typescript: 'ts',
  python: 'py',
  bash: 'sh',
  shell: 'sh',
  ruby: 'rb',
  php: 'php',
  java: 'java',
  go: 'go',
  rust: 'rs',
  cpp: 'cpp',
  c: 'c',
};

/**
 * Get language identifier for syntax highlighting
 */
const getLanguageFromInterpreter = (interpreter: string): string => {
  const languageMap: Record<string, string> = {
    python: 'python',
    python3: 'python',
    node: 'javascript',
    nodejs: 'javascript',
    bash: 'bash',
    sh: 'bash',
    ruby: 'ruby',
    php: 'php',
    java: 'java',
    go: 'go',
    rust: 'rust',
    cpp: 'cpp',
    'c++': 'cpp',
    gcc: 'c',
    clang: 'c',
  };

  return languageMap[interpreter.toLowerCase()] || 'text';
};

/**
 * Custom script highlighting function for command display
 */
const highlightCommand = (command: string) => {
  return (
    <div className="command-line whitespace-nowrap">
      <span className="text-cyan-400 font-bold">{command}</span>
    </div>
  );
};

/**
 * Renders script execution results with professional code editor and terminal output
 * Modern ScriptResultRenderer
 */
export const ScriptResultRenderer: React.FC<ScriptResultRendererProps> = ({ part }) => {
  const [displayMode, setDisplayMode] = useState<'both' | 'script' | 'execution'>('both');
  const [copied, setCopied] = useState(false);

  // Extract script execution data from different possible structures
  const script = part.script || part.toolInput?.script || part.toolInput?.code || '';
  const interpreter = part.interpreter || part.toolInput?.interpreter || 'python';
  const stdout = part.stdout || part.toolResult?.stdout || part.toolResult?.output || '';
  const stderr = part.stderr || part.toolResult?.stderr || part.toolResult?.error || '';
  const exitCode = part.exitCode ?? part.toolResult?.exitCode ?? part.toolResult?.exit_code;

  if (!script && !stdout && !stderr) {
    return <div className="text-gray-500 italic">Script result is empty</div>;
  }

  // Exit code styling
  const isError = exitCode !== 0 && exitCode !== undefined;
  const hasOutput = stdout || stderr;

  // Get language for syntax highlighting
  const language = getLanguageFromInterpreter(interpreter);

  const copyToClipboard = async () => {
    const textToCopy = `${script}\n\n# Output:\n${stdout}${stderr ? `\n# Error:\n${stderr}` : ''}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Display mode toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setDisplayMode('both')}
            className={`px-3 py-1.5 text-xs font-medium ${
              displayMode === 'both'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/30'
            } rounded-l-lg border border-gray-200 dark:border-gray-600`}
          >
            <div className="flex items-center">
              <FiCode size={12} className="mr-1.5" />
              <span>Both</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setDisplayMode('script')}
            className={`px-3 py-1.5 text-xs font-medium ${
              displayMode === 'script'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/30'
            } border-t border-b border-gray-200 dark:border-gray-600`}
          >
            <div className="flex items-center">
              <FiCode size={12} className="mr-1.5" />
              <span>Script</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setDisplayMode('execution')}
            className={`px-3 py-1.5 text-xs font-medium ${
              displayMode === 'execution'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/30'
            } rounded-r-lg border border-gray-200 dark:border-gray-600 border-l-0`}
          >
            <div className="flex items-center">
              <FiTerminal size={12} className="mr-1.5" />
              <span>Execution</span>
            </div>
          </button>
        </div>
      </div>

      {/* Script content with professional code editor */}
      {(displayMode === 'both' || displayMode === 'script') && script && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <SimpleCodeEditor
            code={script}
            language={language}
            fileName={`script.${LANGUAGE_EXTENSIONS[language] || 'txt'}`}
            showLineNumbers={true}
            maxHeight={displayMode === 'both' ? '40vh' : '80vh'}
          />
        </motion.div>
      )}

      {/* Execution results with terminal interface */}
      {(displayMode === 'both' || displayMode === 'execution') && hasOutput && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: displayMode === 'both' ? 0.1 : 0 }}
        >
          <div className="rounded-lg overflow-hidden border border-gray-900 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
            {/* Terminal title bar */}
            <div className="bg-[#111111] px-3 py-1.5 border-b border-gray-900 flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex space-x-1.5 mr-3">
                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
                </div>
                <div className="text-gray-400 text-xs font-medium flex items-center gap-2">
                  <FiPlay size={10} />
                  <span>Script Execution - {interpreter}</span>
                  {exitCode !== undefined && (
                    <span
                      className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${
                        isError
                          ? 'bg-red-900/30 text-red-400 border border-red-800/50'
                          : 'bg-green-900/30 text-green-400 border border-green-800/50'
                      }`}
                    >
                      exit {exitCode}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Copy button */}
              <button
                onClick={copyToClipboard}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                title="Copy script and output"
              >
                {copied ? <FiCheck size={12} /> : <FiCopy size={12} />}
              </button>
            </div>

            {/* Terminal content area */}
            <div className="bg-black p-3 font-mono text-sm terminal-content overflow-auto max-h-[80vh]">
              <div className="space-y-1">
                {/* Command section */}
                <div className="flex items-start">
                  <span className="select-none text-green-400 mr-2 font-bold">$</span>
                  <div className="flex-1 text-gray-200">
                    {highlightCommand(`${interpreter} << 'EOF'`)}
                  </div>
                </div>

                {/* Output section */}
                {stdout && (
                  <div className="ml-4 mt-2">
                    <pre className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                      {stdout}
                    </pre>
                  </div>
                )}

                {/* Error output */}
                {stderr && (
                  <div className="ml-4 mt-2">
                    <pre className="text-red-400 whitespace-pre-wrap leading-relaxed">{stderr}</pre>
                  </div>
                )}

                {/* End marker */}
                <div className="flex items-start mt-2">
                  <span className="select-none text-green-400 mr-2 font-bold">$</span>
                  <span className="text-gray-500 text-xs">EOF</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};