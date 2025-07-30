'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiPaperclip } from 'react-icons/fi';

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


  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleKeyDownCtrl = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' && e.ctrlKey) || (e.key === 'Enter' && !e.shiftKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 pb-6">
      <form onSubmit={handleSubmit} className="relative">
        <div className={`relative overflow-hidden rounded-3xl border-2 transition-all duration-300 ${
          isFocused 
            ? 'border-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-[1px]' 
            : 'border-gray-200/80 dark:border-gray-700/40 bg-white dark:bg-gray-800/90'
        }`}>
          <div className="relative bg-white dark:bg-gray-800 rounded-3xl">
            <div className="flex items-center px-4 py-3">
              {/* Attachment Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-shrink-0 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Attach file or paste image"
              >
                <FiPaperclip className="w-5 h-5" />
              </motion.button>

              {/* Message Input */}
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDownCtrl}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={disabled ? "Please wait..." : "Ask Iris something... (Ctrl+Enter to send)"}
                disabled={disabled || isLoading}
                className="flex-1 resize-none border-0 bg-transparent px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-0"
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
                className={`flex-shrink-0 p-2.5 rounded-full transition-all duration-300 ${
                  message.trim() && !disabled && !isLoading
                    ? 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-white'
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
          <div className="mt-3 text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Use Ctrl+Enter to quickly send • You can also paste images directly
            </div>
          </div>
        )}
      </form>
    </div>
  );
};