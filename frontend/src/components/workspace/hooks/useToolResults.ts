import { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { ToolResultData } from '../types';

export const useToolResults = () => {
  const { socket } = useSocket();
  const [toolResults, setToolResults] = useState<ToolResultData[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleToolResult = (data: { messageId: string; content: any[] }) => {
      if (data.content && data.content.length > 0) {
        data.content.forEach((contentPart: any) => {
          const toolResultData: ToolResultData = {
            messageId: data.messageId,
            toolName: contentPart.toolName || contentPart.name || 'unknown',
            toolInput: contentPart.toolInput || {},
            toolResult: contentPart.toolResult || {},
            status: contentPart.status || 'success',
            timestamp: contentPart.timestamp || new Date().toISOString(),
            fullJson: contentPart.fullJson || JSON.stringify(contentPart, null, 2),
            content: data.content
          };

          setToolResults(prev => [...prev, toolResultData]);
        });
      }
    };

    socket.on('tool_result', handleToolResult);

    return () => {
      socket.off('tool_result', handleToolResult);
    };
  }, [socket]);

  return { toolResults, setToolResults };
};