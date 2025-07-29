'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiMessageSquare, FiSearch, FiX, FiChevronDown, FiRefreshCw, FiHome } from 'react-icons/fi';
import { useChat } from '@/hooks/useChat';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const {
    sessions,
    currentSessionId,
    connected,
    createSession,
    joinSession,
    deleteSession,
  } = useChat();

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  const filteredSessions = (sessions || []).filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group sessions by time periods like UI-TARS
  const groupSessionsByTime = (sessions: any[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const groups = {
      today: [] as any[],
      yesterday: [] as any[],
      thisWeek: [] as any[],
    };
    
    sessions.forEach(session => {
      const sessionDate = new Date(session.updatedAt);
      if (sessionDate >= today) {
        groups.today.push(session);
      } else if (sessionDate >= yesterday) {
        groups.yesterday.push(session);
      } else if (sessionDate >= thisWeek) {
        groups.thisWeek.push(session);
      }
    });
    
    return groups;
  };
  
  const groupedSessions = searchQuery ? null : groupSessionsByTime(filteredSessions);

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
    <div className="flex h-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
      {/* ToolBar - Always visible like UI-TARS */}
      <div className="w-14 h-full flex flex-col border-r border-gray-100/40 dark:border-gray-700/20">
        <div className="flex flex-col items-center py-3 space-y-3">
          {/* Home Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:shadow-md transition-all duration-200 border border-gray-200/60 dark:border-gray-700/40"
            title="Home"
          >
            <FiHome className="w-4 h-4" />
          </motion.button>
          
          {/* New Chat Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={createSession}
            disabled={!connected}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 border shadow-sm ${
              connected
                ? 'bg-gradient-to-br from-accent-500 to-accent-600 text-white hover:shadow-lg border-accent-500/20'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border-gray-300/40 dark:border-gray-600/40'
            }`}
            title="New Chat"
          >
            <FiPlus className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* ChatSession Panel - Collapsible like UI-TARS */}
      <motion.div
        initial={false}
        animate={{
          width: isOpen ? 256 : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="overflow-hidden"
      >
        {isOpen && (
          <div className="w-64 flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100/40 dark:border-gray-700/20">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Tasks</h2>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  connected ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {/* refresh functionality */}}
                  className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded-md hover:bg-gray-100/40 dark:hover:bg-gray-700/40"
                  title="Refresh"
                >
                  <FiRefreshCw className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Search */}
            <div className="px-4 py-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100/60 dark:bg-gray-800/60 border border-gray-200/40 dark:border-gray-700/40 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-accent-500 dark:focus:border-accent-400 transition-colors"
                />
                {searchQuery && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <FiX className="w-3 h-3" />
                  </motion.button>
                )}
              </div>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto px-4">
              {searchQuery ? (
                /* Search Results */
                <div className="space-y-1">
                  <AnimatePresence>
                    {filteredSessions.map((session, index) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0, transition: { delay: index * 0.02 } }}
                        exit={{ opacity: 0, x: -10 }}
                        className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                          currentSessionId === session.id
                            ? 'bg-accent-100/60 dark:bg-accent-900/20'
                            : 'hover:bg-gray-100/60 dark:hover:bg-gray-800/40'
                        }`}
                        onClick={() => joinSession(session.id)}
                      >
                        <FiMessageSquare className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {session.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTimestamp(new Date(session.updatedAt))}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                /* Grouped Results */
                <div className="space-y-1">
                  {/* TODAY */}
                  {groupedSessions && groupedSessions.today.length > 0 && (
                    <div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleGroup('today')}
                        className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-100/40 dark:hover:bg-gray-800/40 rounded-lg transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          TODAY ({groupedSessions.today.length})
                        </span>
                        <motion.div
                          animate={{ rotate: collapsedGroups.has('today') ? 0 : -90 }}
                          transition={{ duration: 0.2 }}
                        >
                          <FiChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        </motion.div>
                      </motion.button>
                      <AnimatePresence>
                        {!collapsedGroups.has('today') && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="ml-2 space-y-1 pb-2">
                              {groupedSessions.today.map((session, index) => (
                                <motion.div
                                  key={session.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0, transition: { delay: index * 0.02 } }}
                                  className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                    currentSessionId === session.id
                                      ? 'bg-accent-100/60 dark:bg-accent-900/20'
                                      : 'hover:bg-gray-100/60 dark:hover:bg-gray-800/40'
                                  }`}
                                  onClick={() => joinSession(session.id)}
                                >
                                  <FiMessageSquare className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {session.title}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatTimestamp(new Date(session.updatedAt))}
                                    </p>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* YESTERDAY */}
                  {groupedSessions && groupedSessions.yesterday.length > 0 && (
                    <div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleGroup('yesterday')}
                        className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-100/40 dark:hover:bg-gray-800/40 rounded-lg transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          YESTERDAY ({groupedSessions.yesterday.length})
                        </span>
                        <motion.div
                          animate={{ rotate: collapsedGroups.has('yesterday') ? 0 : -90 }}
                          transition={{ duration: 0.2 }}
                        >
                          <FiChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        </motion.div>
                      </motion.button>
                      <AnimatePresence>
                        {!collapsedGroups.has('yesterday') && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="ml-2 space-y-1 pb-2">
                              {groupedSessions.yesterday.map((session, index) => (
                                <motion.div
                                  key={session.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0, transition: { delay: index * 0.02 } }}
                                  className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                    currentSessionId === session.id
                                      ? 'bg-accent-100/60 dark:bg-accent-900/20'
                                      : 'hover:bg-gray-100/60 dark:hover:bg-gray-800/40'
                                  }`}
                                  onClick={() => joinSession(session.id)}
                                >
                                  <FiMessageSquare className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {session.title}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatTimestamp(new Date(session.updatedAt))}
                                    </p>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* THIS WEEK */}
                  {groupedSessions && groupedSessions.thisWeek.length > 0 && (
                    <div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleGroup('thisWeek')}
                        className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-100/40 dark:hover:bg-gray-800/40 rounded-lg transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          THIS WEEK ({groupedSessions.thisWeek.length})
                        </span>
                        <motion.div
                          animate={{ rotate: collapsedGroups.has('thisWeek') ? 0 : -90 }}
                          transition={{ duration: 0.2 }}
                        >
                          <FiChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        </motion.div>
                      </motion.button>
                      <AnimatePresence>
                        {!collapsedGroups.has('thisWeek') && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="ml-2 space-y-1 pb-2">
                              {groupedSessions.thisWeek.map((session, index) => (
                                <motion.div
                                  key={session.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0, transition: { delay: index * 0.02 } }}
                                  className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                    currentSessionId === session.id
                                      ? 'bg-accent-100/60 dark:bg-accent-900/20'
                                      : 'hover:bg-gray-100/60 dark:hover:bg-gray-800/40'
                                  }`}
                                  onClick={() => joinSession(session.id)}
                                >
                                  <FiMessageSquare className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {session.title}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatTimestamp(new Date(session.updatedAt))}
                                    </p>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              )}

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
                    {searchQuery ? 'No matching tasks' : 'No tasks yet'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {searchQuery ? 'Try adjusting your search' : 'Create a new task to begin'}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Footer with Connection Status */}
            <div className="px-6 py-5 border-t border-gray-100/40 dark:border-gray-700/20">
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
        )}
      </motion.div>
    </div>
  );
};