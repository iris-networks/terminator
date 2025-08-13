import React from 'react';
import { FiLayers, FiZap, FiFileText, FiMonitor, FiCode, FiCheck, FiX, FiCopy, FiTerminal, FiGlobe, FiSearch, FiFolder } from 'react-icons/fi';

interface ToolHeaderProps {
  toolName: string;
  status: 'success' | 'error';
  timestamp: string;
  onCopy: () => void;
  copied: boolean;
}

const getToolIcon = (toolName: string) => {
  const iconMap: Record<string, JSX.Element> = {
    'web_search': <FiGlobe className="text-blue-400" />,
    'file_read': <FiFileText className="text-green-400" />,
    'list_files': <FiFolder className="text-yellow-400" />,
    'execute_command': <FiTerminal className="text-purple-400" />,
    'browser_action': <FiMonitor className="text-cyan-400" />,
    'browser_get_markdown': <FiFileText className="text-orange-400" />,
    'enhanced_search': <FiSearch className="text-blue-500" />,
    'enhanced_visit_link': <FiGlobe className="text-green-500" />,
    'deep_dive': <FiLayers className="text-purple-500" />,
    'python_codeact': <FiCode className="text-blue-600" />,
    'node_codeact': <FiCode className="text-green-600" />,
    'shell_codeact': <FiTerminal className="text-gray-600" />
  };

  return iconMap[toolName] || <FiZap className="text-gray-400" />;
};

export const ToolHeader: React.FC<ToolHeaderProps> = ({
  toolName,
  status,
  timestamp,
  onCopy,
  copied
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3">
        {getToolIcon(toolName)}
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {new Date(timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {status === 'success' ? (
          <FiCheck className="text-green-400" />
        ) : (
          <FiX className="text-red-400" />
        )}
        <button
          onClick={onCopy}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
          title="Copy JSON"
        >
          <FiCopy className={copied ? 'text-green-400' : ''} />
        </button>
      </div>
    </div>
  );
};