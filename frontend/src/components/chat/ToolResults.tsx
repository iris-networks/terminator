'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiTerminal, 
  FiSearch, 
  FiFile, 
  FiGlobe, 
  FiCopy, 
  FiDownload,
  FiChevronDown,
  FiChevronUp,
  FiCheck,
  FiX,
  FiClock,
  FiExternalLink
} from 'react-icons/fi';

export interface ToolResult {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: any;
  error?: string;
  timestamp: Date;
  duration?: number;
  status: 'running' | 'success' | 'error';
}

interface ToolResultsProps {
  toolCalls: ToolResult[];
}

// Terminal output component
const TerminalOutput: React.FC<{ result: any }> = ({ result }) => {
  const [copied, setCopied] = useState(false);

  const copyOutput = () => {
    navigator.clipboard.writeText(result.output || result.error || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm relative">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <FiTerminal className="w-4 h-4" />
          <span className="text-gray-400">Terminal</span>
          {result.command && (
            <span className="text-blue-400">$ {result.command}</span>
          )}
        </div>
        <button
          onClick={copyOutput}
          className="text-gray-400 hover:text-white transition-colors"
          title="Copy output"
        >
          {copied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
        </button>
      </div>
      
      <div className="whitespace-pre-wrap max-h-96 overflow-y-auto">
        {result.output && (
          <div className="text-green-400">{result.output}</div>
        )}
        {result.error && (
          <div className="text-red-400 mt-2">
            <div className="text-red-300">stderr:</div>
            {result.error}
          </div>
        )}
      </div>
      
      {result.exitCode !== undefined && (
        <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400">
          Exit code: <span className={result.exitCode === 0 ? 'text-green-400' : 'text-red-400'}>
            {result.exitCode}
          </span>
          {result.duration && (
            <span className="ml-4">Duration: {result.duration}ms</span>
          )}
        </div>
      )}
    </div>
  );
};

// Web search results component
const WebSearchResults: React.FC<{ result: any }> = ({ result }) => {
  if (!result.results || result.results.length === 0) {
    return (
      <div className="text-gray-500 italic">No search results found</div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <FiSearch className="w-4 h-4" />
        <span>Found {result.totalResults} results for "{result.query}"</span>
      </div>
      
      {result.results.map((item: any, index: number) => (
        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center space-x-1"
              >
                <span>{item.title}</span>
                <FiExternalLink className="w-3 h-3" />
              </a>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {item.domain} • {new Date(item.publishedDate).toLocaleDateString()}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mt-2 text-sm leading-relaxed">
                {item.snippet}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// File content component
const FileContent: React.FC<{ result: any }> = ({ result }) => {
  const [copied, setCopied] = useState(false);

  const copyContent = () => {
    navigator.clipboard.writeText(result.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLanguageFromPath = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'jsx': 'javascript',
      'tsx': 'typescript',
      'py': 'python',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown',
    };
    return langMap[ext || ''] || 'text';
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FiFile className="w-4 h-4" />
          <span className="font-mono text-sm">{result.path}</span>
          <span className="text-xs text-gray-500">
            ({result.size} bytes)
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={copyContent}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            title="Copy content"
          >
            {copied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
          {result.content || result.error}
        </pre>
      </div>
    </div>
  );
};

// Browser action component
const BrowserAction: React.FC<{ result: any }> = ({ result }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <FiGlobe className="w-4 h-4" />
        <span>Browser Action: {result.action}</span>
        {result.duration && (
          <span className="text-xs">({result.duration}ms)</span>
        )}
      </div>
      
      {result.navigatedTo && (
        <div className="text-sm">
          <span className="text-gray-500">Navigated to: </span>
          <a href={result.navigatedTo} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
            {result.navigatedTo}
          </a>
        </div>
      )}
      
      {result.extractedData && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <div className="text-sm font-medium mb-2">Extracted Data:</div>
          <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(result.extractedData, null, 2)}</pre>
        </div>
      )}
      
      {result.screenshotPath && (
        <div>
          <div className="text-sm font-medium mb-2">Screenshot:</div>
          <img 
            src={`/api/files/${result.screenshotPath}`} 
            alt="Browser screenshot"
            className="max-w-full rounded-lg border border-gray-200 dark:border-gray-700"
          />
        </div>
      )}
    </div>
  );
};

// Generic tool result component
const GenericToolResult: React.FC<{ result: any }> = ({ result }) => {
  const [copied, setCopied] = useState(false);

  const copyResult = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Result</span>
        <button
          onClick={copyResult}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          title="Copy result"
        >
          {copied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
        </button>
      </div>
      <pre className="text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-200 max-h-64 overflow-y-auto">
        {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
};

// Single tool result component
const ToolResultItem: React.FC<{ toolCall: ToolResult }> = ({ toolCall }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 dark:text-green-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      case 'running': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <FiCheck className="w-4 h-4" />;
      case 'error': return <FiX className="w-4 h-4" />;
      case 'running': return <FiClock className="w-4 h-4 animate-spin" />;
      default: return <FiClock className="w-4 h-4" />;
    }
  };

  const renderToolResult = () => {
    if (toolCall.error) {
      return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="text-red-800 dark:text-red-200 font-medium mb-2">Error</div>
          <div className="text-red-700 dark:text-red-300 text-sm">{toolCall.error}</div>
        </div>
      );
    }

    if (!toolCall.result) return null;

    switch (toolCall.name) {
      case 'execute_command':
      case 'shell_execute':
      case 'python_execute':
      case 'node_execute':
        return <TerminalOutput result={toolCall.result} />;
      
      case 'web_search':
        return <WebSearchResults result={toolCall.result} />;
      
      case 'file_read':
        return <FileContent result={toolCall.result} />;
      
      case 'browser_action':
      case 'visual_navigate':
      case 'visual_click':
      case 'visual_type':
      case 'visual_analyze':
        return <BrowserAction result={toolCall.result} />;
      
      default:
        return <GenericToolResult result={toolCall.result} />;
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className={getStatusColor(toolCall.status)}>
            {getStatusIcon(toolCall.status)}
          </div>
          <div className="text-left">
            <div className="font-medium text-gray-900 dark:text-white">
              {toolCall.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(toolCall.timestamp).toLocaleTimeString()}
              {toolCall.duration && ` • ${toolCall.duration}ms`}
            </div>
          </div>
        </div>
        <div className="text-gray-400">
          {isExpanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
        </div>
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              {renderToolResult()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const ToolResults: React.FC<ToolResultsProps> = ({ toolCalls }) => {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="space-y-3 mt-4">
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Tool Results ({toolCalls.length})
      </div>
      {toolCalls.map((toolCall) => (
        <ToolResultItem key={toolCall.id} toolCall={toolCall} />
      ))}
    </div>
  );
};