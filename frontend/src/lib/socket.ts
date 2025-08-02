'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeSocket = (serverUrl: string = 'http://localhost:3000') => {
  if (!socket) {
    socket = io(serverUrl, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('🔌 Connected to server:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from server');
    });

    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });
  }

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};