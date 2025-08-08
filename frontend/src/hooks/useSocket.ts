'use client';

import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { initializeSocket, getSocket } from '@/lib/socket';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socketInstance = initializeSocket();
    setSocket(socketInstance);

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);

    // Set initial connection state
    setConnected(socketInstance.connected);

    return () => {
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
    };
  }, []);

  return { socket, connected };
};