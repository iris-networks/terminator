'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiCpu, FiCopy, FiTool, FiChevronDown, FiChevronRight, FiCheck, FiX } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  thinking?: boolean;
  metadata?: {
    tokens?: number;
    toolCalls?: ToolCall[];
  };
}

interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: any;
  error?: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

const ToolCallRenderer: React.FC<{ toolCall: ToolCall }> = ({ toolCall }) => {
  const [expanded, setExpanded] = useState(false);
  
  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case 'web_search': return '🔍';
      case 'file_read': return '📖';
      case 'file_write': return '✍️';
      case 'execute_command': return '⚡';
      case 'browser_action': return '🌐';
      case 'list_files': return '📁';
      case 'create_directory': return '📁';
      default: return '🛠️';
    }
  };

  const formatToolName = (toolName: string) => {
    return toolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 flex items-center justify-between text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getToolIcon(toolCall.name)}</span>
          <span className="font-medium">{formatToolName(toolCall.name)}</span>
          {toolCall.error ? (
            <FiX className="w-4 h-4 text-red-500" />
          ) : (
            <FiCheck className="w-4 h-4 text-green-500" />
          )}
        </div>
        {expanded ? <FiChevronDown className="w-4 h-4" /> : <FiChevronRight className="w-4 h-4" />}
      </button>
      
      {expanded && (
        <div className="p-3 bg-white dark:bg-gray-850 border-t border-gray-200 dark:border-gray-700">
          {/* Arguments */}
          {Object.keys(toolCall.arguments).length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Arguments:</h4>
              <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto">
                {JSON.stringify(toolCall.arguments, null, 2)}
              </pre>
            </div>
          )}
          
          {/* Result or Error */}
          {toolCall.error ? (
            <div>
              <h4 className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Error:</h4>
              <div className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                {toolCall.error}
              </div>
            </div>
          ) : toolCall.result && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Result:</h4>
              <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto max-h-48 overflow-y-auto">
                {typeof toolCall.result === 'string' 
                  ? toolCall.result 
                  : JSON.stringify(toolCall.result, null, 2)
                }
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isThinking = message.thinking;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (isThinking) {
    return (
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <FiCpu className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-3">
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <span className="text-sm mr-2">Thinking</span>
              <div className="thinking-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start space-x-4 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-green-600 text-white' 
            : 'bg-blue-600 text-white'
        }`}>
          {isUser ? <FiUser className="w-4 h-4" /> : <FiCpu className="w-4 h-4" />}
        </div>
      </div>

      {/* Message Content */}
      <div className={`flex-1 min-w-0 ${isUser ? 'flex justify-end' : ''}`}>
        <div className={`relative group ${isUser ? 'max-w-[80%]' : ''}`}>
          <div className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-blue-600 text-white ml-auto'
              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
          }`}>
            {isUser ? (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\\w+)/.exec(className || '');
                      return !inline && match ? (
                        <div className="relative">
                          <SyntaxHighlighter
                            style={oneDark}
                            language={match[1]}
                            PreTag="div"
                            className="rounded-lg !mt-2 !mb-2"
                            {...props}
                          >
                            {String(children).replace(/\\n$/, '')}
                          </SyntaxHighlighter>
                          <button
                            onClick={() => copyToClipboard(String(children))}
                            className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 hover:text-white transition-colors"
                          >
                            <FiCopy className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <code className={`${className} bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm`} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
                
                {/* Render tool calls if present */}
                {message.metadata?.toolCalls && message.metadata.toolCalls.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 flex items-center">
                      <FiTool className="w-3 h-3 mr-1" />
                      Tool Usage
                    </div>
                    {message.metadata.toolCalls.map((toolCall) => (
                      <ToolCallRenderer key={toolCall.id} toolCall={toolCall} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Copy button for assistant messages */}
          {!isUser && (
            <button
              onClick={() => copyToClipboard(message.content)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-all"
            >
              <FiCopy className="w-3 h-3" />
            </button>
          )}
        </div>
        
        {/* Timestamp */}
        <div className={`text-xs text-gray-500 mt-2 ${isUser ? 'text-right' : ''}`}>
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </motion.div>
  );
};