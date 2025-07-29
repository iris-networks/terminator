'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiMic } from 'react-icons/fi';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  isLoading = false, 
  disabled = false 
}) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  return (
    <div className="p-6 border-t border-gray-100/60 dark:border-gray-700/20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="relative">
        <div className={`relative overflow-hidden rounded-3xl border-2 transition-all duration-300 ${
          isFocused 
            ? 'border-transparent bg-gradient-to-r from-accent-500 via-purple-500 to-pink-500 p-[2px] animate-border-flow' 
            : 'border-gray-200/80 dark:border-gray-700/40 bg-white dark:bg-gray-800'
        }`}>
          <div className="relative bg-white dark:bg-gray-800 rounded-3xl">
            <div className="flex items-end">
              {/* Voice Input Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-shrink-0 p-3 text-gray-400 dark:text-gray-500 hover:text-accent-500 dark:hover:text-accent-400 transition-colors"
                title="Voice input"
              >
                <FiMic className="w-5 h-5" />
              </motion.button>

              {/* Message Input */}
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={disabled ? "Please wait..." : "Type your message..."}
                disabled={disabled || isLoading}
                className="flex-1 resize-none border-0 bg-transparent px-2 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-0"
                style={{
                  minHeight: '24px',
                  maxHeight: '120px',
                }}
                rows={1}
              />

              {/* Send Button */}
              <motion.button
                type="submit"
                disabled={!message.trim() || disabled || isLoading}
                whileHover={{ scale: message.trim() && !disabled ? 1.05 : 1 }}
                whileTap={{ scale: message.trim() && !disabled ? 0.95 : 1 }}
                className={`flex-shrink-0 m-2 p-2.5 rounded-full transition-all duration-300 ${
                  message.trim() && !disabled && !isLoading
                    ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiSend className="w-5 h-5" />
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Helper Text */}
        {!disabled && (
          <div className="flex items-center justify-between mt-3 px-4">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Press Enter to send, Shift + Enter for new line
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {message.length > 0 && `${message.length} characters`}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};