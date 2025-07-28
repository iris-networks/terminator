'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiMessageSquare, FiSearch, FiX, FiChevronLeft, FiTrash2, FiEdit3 } from 'react-icons/fi';
import { useChat } from '@/hooks/useChat';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const {
    sessions,
    currentSessionId,
    connected,
    createSession,
    joinSession,
    deleteSession,
  } = useChat();

  const filteredSessions = (sessions || []).filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="flex h-full">
      {/* ToolBar - Left column like UI-TARS */}
      <div className="w-14 flex flex-col items-center py-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        {/* Home/Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggle}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:shadow-md transition-all duration-200 border border-gray-200/60 dark:border-gray-700/40 mb-3"
          title="Toggle Sidebar"
        >
          <FiChevronLeft className="w-4 h-4" />
        </motion.button>
        
        {/* New Chat Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={createSession}
          disabled={!connected}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 border shadow-sm mb-2 ${
            connected
              ? 'bg-gradient-to-br from-accent-500 to-accent-600 text-white hover:shadow-lg border-accent-500/20'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border-gray-300/40 dark:border-gray-600/40'
          }`}
          title="New Chat"
        >
          <FiPlus className="w-4 h-4" />
        </motion.button>
        
      </div>

      {/* Main Sidebar Content */}
      <div className="flex-1 flex flex-col bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        {/* Header */}
        <div className="px-6 py-4">
          <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-white tracking-tight">Conversations</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {sessions?.length || 0} total • {connected ? 'Connected' : 'Disconnected'}
          </p>
        </div>


        {/* Search with Glass Effect */}
        <div className="px-6 pb-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/40 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all duration-200"
            />
            {searchQuery && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100/60 dark:hover:bg-gray-700/60 transition-all duration-200"
              >
                <FiX className="w-3 h-3" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Sessions List with UI-TARS styling */}
        <div className="flex-1 overflow-y-auto px-6">
          <div className="space-y-1">
            <AnimatePresence>
              {filteredSessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0, transition: { delay: index * 0.02 } }}
                  exit={{ opacity: 0, x: -10 }}
                  whileHover={{ x: 2 }}
                  className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                    currentSessionId === session.id
                      ? 'bg-accent-50 dark:bg-accent-900/20 border border-accent-200/60 dark:border-accent-700/40 shadow-sm'
                      : 'hover:bg-gray-100/60 dark:hover:bg-gray-800/60 backdrop-blur-sm'
                  }`}
                  onClick={() => joinSession(session.id)}
                >
                  <div className="flex items-start space-x-3">
                    {/* Message Icon */}
                    <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5 ${
                      currentSessionId === session.id
                        ? 'bg-accent-500 text-white shadow-sm' 
                        : 'bg-gray-200/80 dark:bg-gray-700/80 text-gray-500 dark:text-gray-400'
                    }`}>
                      <FiMessageSquare className="w-4 h-4" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium leading-tight break-words ${
                        currentSessionId === session.id
                          ? 'text-accent-900 dark:text-accent-100'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {session.title}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(new Date(session.updatedAt))}
                        </p>
                        <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {session.messageCount} messages
                        </p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Edit functionality not implemented yet
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-white/80 dark:bg-gray-800/80 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 backdrop-blur-sm shadow-sm"
                        title="Edit session"
                      >
                        <FiEdit3 className="w-3 h-3" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 bg-white/80 dark:bg-gray-800/80 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 backdrop-blur-sm shadow-sm"
                        title="Delete session"
                      >
                        <FiTrash2 className="w-3 h-3" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Empty State */}
            {filteredSessions.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FiMessageSquare className="text-gray-400" size={20} />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">
                  {searchQuery ? 'No matching conversations' : 'No conversations yet'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {searchQuery ? 'Try adjusting your search' : 'Start a new chat to begin'}
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer with Connection Status */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connected ? 'bg-green-500 animate-pulse-slow' : 'bg-gray-400'
            }`} />
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Iris • {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};