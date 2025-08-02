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

import React from 'react';
import { motion } from 'framer-motion';
import { FiGithub, FiTag, FiGitBranch, FiClock, FiCode, FiHeart, FiExternalLink } from 'react-icons/fi';

interface AboutPageProps {
  onClose?: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onClose }) => {
  // Git information - these would typically come from environment variables or build process
  const gitInfo = {
    repository: 'iris-networks/terminator',
    commit: 'a15d9ea',
    branch: 'feat/experimental_mcp',
    version: '1.0.0',
    buildDate: new Date().toISOString(),
  };

  const features = [
    'Multi-Agent Architecture (CodeAct, DeepResearch)',
    'Session Replay with HTML Export',
    'Film Strip Tool Results Interface',
    'Monaco Editor with Syntax Highlighting',
    'Real-time Socket Communication',
    'Modern Design System',
    'Dark Mode Support',
    'Glass Morphism Effects',
  ];

  const technologies = [
    { name: 'React 18', icon: '⚛️' },
    { name: 'TypeScript', icon: '🔷' },
    { name: 'Next.js 14', icon: '▲' },
    { name: 'Tailwind CSS', icon: '🎨' },
    { name: 'Framer Motion', icon: '🎭' },
    { name: 'Socket.io', icon: '🔌' },
    { name: 'Monaco Editor', icon: '📝' },
    { name: 'Node.js', icon: '🟢' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/60 dark:border-gray-700/40 w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="relative px-8 py-6 bg-gradient-to-br from-accent-500 to-accent-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <FiCode className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold">Terminator</h1>
                <p className="text-accent-100 text-lg">AI Agent Platform</p>
              </div>
            </div>
            {onClose && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
              >
                <span className="text-white text-lg font-semibold">×</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Version Information */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
                className="bg-gray-50/80 dark:bg-gray-900/40 rounded-2xl p-6 border border-gray-200/60 dark:border-gray-700/30"
              >
                <h3 className="text-lg font-display font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <FiTag className="mr-2 text-accent-500" />
                  Version Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Version</span>
                    <code className="px-2 py-1 bg-gray-200/60 dark:bg-gray-800/60 rounded-lg text-sm font-mono">
                      {gitInfo.version}
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Branch</span>
                    <div className="flex items-center space-x-1">
                      <FiGitBranch className="w-3 h-3 text-gray-500" />
                      <code className="px-2 py-1 bg-gray-200/60 dark:bg-gray-800/60 rounded-lg text-sm font-mono">
                        {gitInfo.branch}
                      </code>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Commit</span>
                    <code className="px-2 py-1 bg-gray-200/60 dark:bg-gray-800/60 rounded-lg text-sm font-mono">
                      {gitInfo.commit}
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Repository</span>
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      href={`https://github.com/${gitInfo.repository}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 text-sm"
                    >
                      <FiGithub className="w-4 h-4" />
                      <span>{gitInfo.repository}</span>
                      <FiExternalLink className="w-3 h-3" />
                    </motion.a>
                  </div>
                </div>
              </motion.div>

              {/* Technologies */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
                className="bg-gray-50/80 dark:bg-gray-900/40 rounded-2xl p-6 border border-gray-200/60 dark:border-gray-700/30"
              >
                <h3 className="text-lg font-display font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Technologies
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {technologies.map((tech, index) => (
                    <motion.div
                      key={tech.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0, transition: { delay: 0.2 + index * 0.05 } }}
                      className="flex items-center space-x-2 p-2 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-200/40 dark:border-gray-700/30"
                    >
                      <span className="text-lg">{tech.icon}</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {tech.name}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Features */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
                className="bg-gray-50/80 dark:bg-gray-900/40 rounded-2xl p-6 border border-gray-200/60 dark:border-gray-700/30"
              >
                <h3 className="text-lg font-display font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Key Features
                </h3>
                <div className="space-y-2">
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0, transition: { delay: 0.3 + index * 0.05 } }}
                      className="flex items-center space-x-3 p-2 hover:bg-white/60 dark:hover:bg-gray-800/60 rounded-lg transition-all duration-200"
                    >
                      <div className="w-2 h-2 bg-accent-500 rounded-full flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Credits */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}
                className="bg-gradient-to-br from-accent-50 to-purple-50 dark:from-accent-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-accent-200/60 dark:border-accent-700/30"
              >
                <h3 className="text-lg font-display font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <FiHeart className="mr-2 text-red-500" />
                  Acknowledgments
                </h3>
                <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  <p>
                    Modern, intuitive UI design with{' '}
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      href="https://github.com/iris-ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-600 dark:text-accent-400 hover:text-accent-700 font-medium inline-flex items-center"
                    >
                      open source components <FiExternalLink className="w-3 h-3 ml-1" />
                    </motion.a>
                  </p>
                  <p>Built with modern web technologies and a focus on user experience.</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                    <FiClock className="w-3 h-3 mr-1" />
                    Built on {new Date(gitInfo.buildDate).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};