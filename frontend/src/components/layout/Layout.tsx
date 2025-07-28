'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AboutPage } from '@/components/about/AboutPage';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAbout, setShowAbout] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Elegant Sidebar with Glass Effect */}
      <motion.div
        initial={false}
        animate={{
          width: sidebarOpen ? 256 : 0,
          opacity: sidebarOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="flex-shrink-0 overflow-hidden"
      >
        <div className="h-full backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
          <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        </div>
      </motion.div>

      {/* Main Content Area with Refined Design */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Elegant Navigation Bar */}
        <div className="h-12 flex items-center justify-between px-6 backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
          <div className="flex items-center space-x-4">
            {/* macOS-style Traffic Lights */}
            <div className="flex space-x-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400 dark:bg-red-500 border border-red-500/20 dark:border-red-400/20 shadow-sm"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400 dark:bg-yellow-500 border border-yellow-500/20 dark:border-yellow-400/20 shadow-sm"></div>
              <div className="w-3 h-3 rounded-full bg-green-400 dark:bg-green-500 border border-green-500/20 dark:border-green-400/20 shadow-sm"></div>
            </div>
            
            {!sidebarOpen && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100/60 dark:hover:bg-gray-800/60 transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </motion.button>
            )}
            
            <h1 className="text-lg font-display font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
              Iris
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAbout(true)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100/60 dark:hover:bg-gray-800/60 transition-colors"
              title="About Iris"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.button>
            <ThemeToggle />
          </div>
        </div>

        {/* Main Content with Glass Container */}
        <div className="flex-1 overflow-hidden p-6">
          <div className="h-full rounded-3xl overflow-hidden backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 shadow-sm">
            {children}
          </div>
        </div>
      </div>
      
      {/* About Modal */}
      <AnimatePresence>
        {showAbout && <AboutPage onClose={() => setShowAbout(false)} />}
      </AnimatePresence>
    </div>
  );
};