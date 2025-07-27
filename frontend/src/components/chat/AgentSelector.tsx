'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiCpu, FiCode, FiSearch, FiEye, FiUsers } from 'react-icons/fi';

export type AgentType = 'basic' | 'codeact' | 'deep_research' | 'gui' | 'multi_agent';

interface Agent {
  type: AgentType;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  specializations: string[];
}

const AGENTS: Agent[] = [
  {
    type: 'basic',
    name: 'Basic Agent',
    description: 'General-purpose agent with web search, file operations, and basic automation',
    icon: <FiCpu className="w-4 h-4" />,
    color: 'blue',
    specializations: ['Web Search', 'File Management', 'Basic Automation']
  },
  {
    type: 'codeact',
    name: 'CodeAct Agent',
    description: 'Code execution specialist supporting Python, Node.js, and shell scripting',
    icon: <FiCode className="w-4 h-4" />,
    color: 'green',
    specializations: ['Python', 'Node.js', 'Shell Scripts', 'Code Execution']
  },
  {
    type: 'deep_research',
    name: 'Deep Research Agent',
    description: 'Advanced research specialist with comprehensive investigation capabilities',
    icon: <FiSearch className="w-4 h-4" />,
    color: 'purple',
    specializations: ['Research Planning', 'Content Analysis', 'Report Generation']
  },
  {
    type: 'gui',
    name: 'GUI Agent',
    description: 'Visual browser automation with screenshot-based interaction',
    icon: <FiEye className="w-4 h-4" />,
    color: 'orange',
    specializations: ['Visual Automation', 'GUI Interaction', 'Web Scraping']
  },
  {
    type: 'multi_agent',
    name: 'Multi-Agent Orchestrator',
    description: 'Coordinates multiple agents for complex multi-step tasks',
    icon: <FiUsers className="w-4 h-4" />,
    color: 'pink',
    specializations: ['Task Orchestration', 'Agent Coordination', 'Workflow Management']
  }
];

interface AgentSelectorProps {
  selectedAgent: AgentType;
  onAgentChange: (agent: AgentType) => void;
  className?: string;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  selectedAgent,
  onAgentChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentAgent = AGENTS.find(agent => agent.type === selectedAgent) || AGENTS[0];
  
  const getColorClasses = (color: string, variant: 'bg' | 'text' | 'border' = 'bg') => {
    const colorMap = {
      blue: { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-200' },
      green: { bg: 'bg-green-500', text: 'text-green-600', border: 'border-green-200' },
      purple: { bg: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-200' },
      orange: { bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-200' },
      pink: { bg: 'bg-pink-500', text: 'text-pink-600', border: 'border-pink-200' }
    };
    return colorMap[color as keyof typeof colorMap]?.[variant] || colorMap.blue[variant];
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full text-left"
      >
        <div className={`p-1.5 rounded-lg ${getColorClasses(currentAgent.color)} text-white`}>
          {currentAgent.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 dark:text-white text-sm">
            {currentAgent.name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {currentAgent.specializations.slice(0, 2).join(', ')}
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <FiChevronDown className="w-4 h-4 text-gray-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 overflow-hidden"
            >
              {AGENTS.map((agent) => (
                <button
                  key={agent.type}
                  onClick={() => {
                    onAgentChange(agent.type);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start space-x-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    agent.type === selectedAgent ? 'bg-gray-50 dark:bg-gray-700' : ''
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${getColorClasses(agent.color)} text-white flex-shrink-0 mt-0.5`}>
                    {agent.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                      {agent.name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                      {agent.description}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {agent.specializations.map((spec, index) => (
                        <span
                          key={index}
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${getColorClasses(agent.color, 'text')} bg-gray-100 dark:bg-gray-700`}
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                  {agent.type === selectedAgent && (
                    <div className={`w-2 h-2 rounded-full ${getColorClasses(agent.color)} mt-2`} />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};