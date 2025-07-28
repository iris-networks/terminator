'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { FiMessageSquare, FiInfo, FiWifiOff } from 'react-icons/fi';
import { useChat } from '@/hooks/useChat';

export const ChatInterface: React.FC = () => {
  const {
    messages,
    currentSessionId,
    isLoading,
    isThinking,
    connected,
    sendMessage,
  } = useChat();
  
  // Removed agent selection - always use multi_agent
  const selectedAgent = 'multi_agent';
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (content: string) => {
    // Include agent type in message metadata
    sendMessage(content, { agentType: selectedAgent });
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto chat-scrollbar">
        {/* Connection Status */}
        {!connected && (
          <div className="mx-6 mt-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm rounded-xl border border-red-200 dark:border-red-800">
            <div className="flex items-center">
              <FiWifiOff className="mr-2 text-red-500" />
              <span className="font-medium">Disconnected from server</span>
            </div>
            <div className="text-xs mt-1 opacity-75">
              Attempting to reconnect...
            </div>
          </div>
        )}

        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center h-full"
          >
            <div className="text-center p-6 max-w-md">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700"
              >
                <FiMessageSquare size={24} />
              </motion.div>
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-200"
              >
                Welcome to Iris
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-gray-600 dark:text-gray-400 mb-5 text-sm leading-relaxed"
              >
                {currentSessionId 
                  ? 'Start a conversation with your AI assistant. Iris can help with web research, file operations, and complex tasks.'
                  : 'Create a new session from the sidebar to begin chatting with Iris.'
                }
              </motion.p>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-2xl text-gray-600 dark:text-gray-400 text-sm border border-gray-100 dark:border-gray-700"
              >
                <FiInfo className="mr-3 text-gray-400 flex-shrink-0" />
                <span>
                  This interface provides Iris with modern AI capabilities and tool integrations.
                </span>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <div className="px-6 py-6 space-y-6">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChatMessage message={message} />
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        {/* Agent selector removed - using single multi-agent */}
        <ChatInput 
          onSendMessage={handleSendMessage} 
          isLoading={isLoading || isThinking}
          disabled={isLoading || isThinking || !connected || !currentSessionId}
        />
      </div>
    </div>
  );
};