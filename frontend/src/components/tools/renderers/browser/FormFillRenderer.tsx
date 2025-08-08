'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FiEdit3, FiCheck, FiX } from 'react-icons/fi';
import { BrowserShell } from '../BrowserShell';
import { ToolResultContentPart } from '../EnhancedToolResultRenderer';

interface FormFillRendererProps {
  part: ToolResultContentPart;
  onAction?: (action: string, data: any) => void;
}

/**
 * Specialized renderer for form input filling actions
 * Shows the form field, input value, and result
 */
export const FormFillRenderer: React.FC<FormFillRendererProps> = ({ part }) => {
  const { toolResult, toolInput } = part;
  const screenshot = toolResult?.screenshot || toolInput?.screenshot;
  const selector = toolInput?.selector || toolInput?.element || '';
  const value = toolInput?.value || toolInput?.text || '';
  const status = toolResult?.status || 'success';

  return (
    <div className="space-y-4">
      {screenshot && (
        <BrowserShell>
          <img 
            src={screenshot} 
            alt="Form fill screenshot" 
            className="w-full h-auto object-contain"
          />
        </BrowserShell>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200/50 dark:border-gray-700/30 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-blue-50/80 dark:bg-blue-900/20 border-b border-blue-100/50 dark:border-blue-800/30 flex items-center">
          <FiEdit3 className="text-blue-600 dark:text-blue-400 mr-2.5" size={18} />
          <div className="font-medium text-blue-700 dark:text-blue-300">Form Input Fill</div>
          <div className={`ml-auto flex items-center space-x-2 ${
            status === 'success' ? 'text-green-600' : 'text-red-600'
          }`}>
            {status === 'success' ? <FiCheck size={16} /> : <FiX size={16} />}
            <span className="text-xs font-medium capitalize">{status}</span>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {selector && (
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Element</div>
              <div className="bg-gray-50 dark:bg-gray-800/90 font-mono text-xs p-2 rounded-md border border-gray-100/50 dark:border-gray-700/30">
                {selector}
              </div>
            </div>
          )}

          {value && (
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Input Value</div>
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100/50 dark:border-blue-800/30"
              >
                <div className="text-sm text-blue-800 dark:text-blue-200 font-medium">"{value}"</div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};