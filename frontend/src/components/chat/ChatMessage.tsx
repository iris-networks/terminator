'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiCpu, FiCopy, FiCheck } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useTheme } from 'next-themes';

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


export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isThinking = message.thinking;
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const copyMessage = () => {
    copyToClipboard(message.content);
  };

  if (isThinking) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start space-x-4 mb-8"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
          <FiCpu className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-gray-800 rounded-2xl px-5 py-4 border border-gray-100/80 dark:border-gray-700/30 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-accent-500 rounded-full animate-thinking"></div>
                <div className="w-2 h-2 bg-accent-500 rounded-full animate-thinking" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-accent-500 rounded-full animate-thinking" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">AI is thinking...</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-8`}
    >
      {/* Avatar for assistant messages */}
      {!isUser && (
        <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-full flex items-center justify-center flex-shrink-0 mr-4 shadow-sm">
          <FiCpu className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Message Content */}
      <div className={`flex-1 min-w-0 ${isUser ? 'flex justify-end' : ''}`}>
        <div className={`relative group ${isUser ? 'max-w-[85%]' : 'max-w-full'}`}>
          <div className={`rounded-2xl px-5 py-4 transition-all duration-300 hover:shadow-md ${
            isUser
              ? 'bg-[#141414] dark:bg-gray-900 text-white shadow-sm'
              : 'bg-white dark:bg-gray-800 border border-gray-100/80 dark:border-gray-700/30 shadow-sm'
          }`}>
            {/* Agent indicator for assistant messages */}
            {!isUser && message.metadata?.agentType && (
              <div className="mb-3 pb-3 border-b border-gray-100/60 dark:border-gray-700/30">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse-slow"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium capitalize tracking-wide">
                    {message.metadata.agentType.replace('_', ' ')} Agent
                  </span>
                </div>
              </div>
            )}
            
            {isUser ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-100 dark:text-gray-100">
                {message.content}
              </p>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none prose-gray">
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\\w+)/.exec(className || '');
                      return !inline && match ? (
                        <div className="relative rounded-xl overflow-hidden border border-gray-200/60 dark:border-gray-700/30 shadow-sm">
                          <SyntaxHighlighter
                            style={theme === 'dark' ? oneDark : oneLight}
                            language={match[1]}
                            PreTag="div"
                            className="!mt-0 !mb-0 !rounded-none"
                            {...props}
                          >
                            {String(children).replace(/\\n$/, '')}
                          </SyntaxHighlighter>
                          <button
                            onClick={() => copyToClipboard(String(children))}
                            className="absolute top-3 right-3 p-2 bg-gray-800/80 dark:bg-gray-700/80 hover:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-gray-300 hover:text-white transition-all duration-200 backdrop-blur-sm"
                          >
                            <FiCopy className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <code className={`${className} bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md text-sm font-mono`} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* Elegant Copy button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0, scale: 0.8 }}
            whileHover={{ opacity: 1, scale: 1 }}
            onClick={copyMessage}
            className={`absolute -top-2 -right-2 p-2 rounded-full transition-all duration-200 backdrop-blur-sm shadow-lg ${
              isUser 
                ? 'bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white' 
                : 'bg-white/80 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200/60 dark:border-gray-700/30'
            } group-hover:opacity-100 group-hover:scale-100`}
          >
            {copied ? <FiCheck className="w-3 h-3 text-green-500" /> : <FiCopy className="w-3 h-3" />}
          </motion.button>
        </div>
      </div>

      {/* Avatar for user messages */}
      {isUser && (
        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 ml-4 shadow-sm">
          <FiUser className="w-4 h-4 text-white" />
        </div>
      )}
    </motion.div>
  );
};