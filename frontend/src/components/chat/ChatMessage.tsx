'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiCpu, FiCopy, FiTool, FiChevronDown, FiChevronRight, FiCheck, FiX } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { ToolResults, ToolResult } from './ToolResults';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  thinking?: boolean;
  toolCalls?: ToolResult[];
  metadata?: {
    tokens?: number;
    agentType?: string;
  };
}

interface ChatMessageProps {
  message: Message;
}

// Remove old ToolCallRenderer - now using ToolResults component

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
            {/* Agent indicator for assistant messages */}
            {!isUser && message.metadata?.agentType && (
              <div className="mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {message.metadata.agentType.replace('_', ' ')} Agent
                  </span>
                </div>
              </div>
            )}
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
                
                {/* Render tool results if present */}
                {message.toolCalls && message.toolCalls.length > 0 && (
                  <ToolResults toolCalls={message.toolCalls} />
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