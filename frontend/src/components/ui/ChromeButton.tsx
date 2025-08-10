'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SiGooglechrome } from 'react-icons/si';

export const ChromeButton: React.FC = () => {
  const handleOpenChrome = async () => {
    try {
      const response = await fetch('/api/chrome/open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error('Failed to open Chrome with profile:', response.statusText);
      }
    } catch (error) {
      console.error('Error opening Chrome:', error);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleOpenChrome}
      className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100/60 dark:hover:bg-gray-800/60 transition-colors"
      title="Open Chrome"
    >
      <SiGooglechrome className="w-5 h-5" />
    </motion.button>
  );
};