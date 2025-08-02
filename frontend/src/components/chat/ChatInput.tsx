/*
 * Copyright 2025 hivelogic pvt ltd, singapore
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiPaperclip } from 'react-icons/fi';

interface ChatInputProps {
  onSendMessage: (message: string, attachments: File[]) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  isLoading = false, 
  disabled = false 
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (fileName: string) => {
    setAttachments(prev => prev.filter(file => file.name !== fileName));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || attachments.length > 0) && !disabled) {
      onSendMessage(message.trim(), attachments);
      setMessage('');
      setAttachments([]);
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
                onClick={() => fileInputRef.current?.click()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-shrink-0 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Attach file or paste image"
              >
                <FiPaperclip className="w-5 h-5" />
              </motion.button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                multiple
                accept="image/*,.pdf,.docx"
              />

              {/* Message Input */}
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDownCtrl}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={disabled ? "Please wait..." : "Ask Terminator something... (Ctrl+Enter to send)"}
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
                disabled={(!message.trim() && attachments.length === 0) || disabled || isLoading}
                whileHover={{ scale: (message.trim() || attachments.length > 0) && !disabled ? 1.05 : 1 }}
                whileTap={{ scale: (message.trim() || attachments.length > 0) && !disabled ? 0.95 : 1 }}
                className={`flex-shrink-0 p-2.5 rounded-full transition-all duration-300 ${
                  (message.trim() || attachments.length > 0) && !disabled && !isLoading
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
            {attachments.length > 0 && (
              <div className="px-4 pb-2 pt-1 border-t border-gray-200 dark:border-gray-700">
                <ul className="flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <li key={index} className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1 text-sm">
                      <span>{file.name}</span>
                      <button onClick={() => removeAttachment(file.name)} className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        &times;
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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