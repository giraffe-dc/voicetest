'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface AudioUpdate {
  frequencies: number[];
  timestamp: number;
  clientId: string;
}

export const useSocketAudio = () => {
  const socketRef = useRef<Socket | null>(null);
  const [remoteAudioData, setRemoteAudioData] = useState<AudioUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [clientId, setClientId] = useState<string>('');

  useEffect(() => {
    // Initialize socket connection with improved configuration
    const socket = io(undefined, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      // Enable both WebSocket and polling
      transports: ['websocket', 'polling'],
      // Socket.IO client-side configuration
      autoConnect: true,
      multiplex: true,
    });

    socket.on('connect', () => {
      console.log('[useSocketAudio] Connected to server:', socket.id);
      setIsConnected(true);
      setClientId(socket.id);
    });

    socket.on('audio-update', (data: AudioUpdate) => {
      setRemoteAudioData(data);
    });

    socket.on('disconnect', () => {
      console.log('[useSocketAudio] Disconnected from server');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[useSocketAudio] Connection error:', error);
    });

    socket.on('error', (error) => {
      console.error('[useSocketAudio] Socket error:', error);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendAudioData = useCallback((frequencies: number[]) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('audio-data', {
        frequencies,
        timestamp: Date.now(),
      });
    }
  }, [isConnected]);

  return {
    sendAudioData,
    remoteAudioData,
    isConnected,
    clientId,
  };
};
