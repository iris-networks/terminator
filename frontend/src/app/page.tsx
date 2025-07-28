'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCode, FiX, FiChevronLeft } from 'react-icons/fi';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ToolResultViewer } from '@/components/tools/ToolResultViewer';
import { Layout } from '@/components/layout/Layout';
import { useSocket } from '@/hooks/useSocket';

export default function HomePage() {
  const { socket } = useSocket();
  const [hasToolResults, setHasToolResults] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [clearResults, setClearResults] = useState(false);

  const handleHasResults = (hasResults: boolean) => {
    console.log('Tool results available:', hasResults); // Debug log
    setHasToolResults(hasResults);
    // Auto-open panel when first tool result arrives, but keep it open afterwards
    if (hasResults) {
      setIsPanelOpen(true);
    }
  };

  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  return (
    <Layout>
      <div className="flex h-full relative">
        {/* Chat Interface */}
        <div className={`transition-all duration-300 ${
          isPanelOpen ? 'flex-1' : 'w-full'
        }`}>
          <div className="h-full relative">
            <ChatInterface />
            
            {/* Toggle Button - Always show */}
            <button
                onClick={togglePanel}
                className={`absolute top-4 right-4 z-10 flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-sm font-medium ${
                  isPanelOpen 
                    ? 'text-gray-600 dark:text-gray-300' 
                    : 'text-blue-600 dark:text-blue-400'
                }`}
                title={isPanelOpen ? 'Close tool results' : 'Open tool results'}
              >
                <FiCode size={16} />
                <span className="hidden sm:inline">
                  {isPanelOpen ? 'Close' : 'Tools'}
                </span>
                {isPanelOpen ? (
                  <FiChevronLeft size={16} />
                ) : (
                  <FiCode size={16} className="opacity-50" />
                )}
              </button>
          </div>
        </div>
        
        {/* Tool Results Panel - Always visible when open */}
        <AnimatePresence>
          {isPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '50%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 min-w-[400px] max-w-[600px]"
            >
              <div className="h-full relative">
                {/* Close button in panel header */}
                <div className="absolute top-4 right-4 z-20">
                  <button
                    onClick={() => setIsPanelOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Close panel"
                  >
                    <FiX size={16} />
                  </button>
                </div>
                
                <ToolResultViewer 
                  socket={socket} 
                  onHasResults={handleHasResults}
                  clearResults={clearResults}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}