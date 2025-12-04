'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface RoomAudioData {
  frequencies: number[];
  timestamp: number;
  clientId: string;
  deviceType: 'mobile' | 'desktop';
}

export const useRoomSocket = (roomId: string = '1') => {
  const socketRef = useRef<Socket | null>(null);
  const pendingRoomRef = useRef<string | null>(roomId || '1');
  const [connectedUsers, setConnectedUsers] = useState<Map<string, RoomAudioData>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [clientId, setClientId] = useState<string>('');
  const [currentRoom, setCurrentRoom] = useState<string>(roomId || '1');

  useEffect(() => {
    // Initialize socket connection once
    const socket = io(undefined as any, {
      path: '/api/socket/',
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      // Prioritize polling first for broader compatibility, then websocket
      transports: ['polling', 'websocket'],
      autoConnect: true,
      multiplex: true,
    });

    socket.on('connect', () => {
      console.log('[useRoomSocket] Connected to server:', socket.id);
      setIsConnected(true);
      setClientId(socket.id as string);

      // If there is a pending room request, join it now
      const pending = pendingRoomRef.current;
      if (pending) {
        socket.emit('join-room', {
          roomId: pending,
          deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop',
        });
        setCurrentRoom(pending);
        pendingRoomRef.current = null;
      }
    });

    socket.on('room-users-update', (users: any) => {
      try {
        setConnectedUsers(new Map(Object.entries(users)));
      } catch (err) {
        console.error('[useRoomSocket] room-users-update parse error', err);
      }
    });

    socket.on('audio-update', (data: RoomAudioData) => {
      setConnectedUsers((prev) => {
        const updated = new Map(prev);
        updated.set(data.clientId, data);
        return updated;
      });
    });

    socket.on('disconnect', () => {
      console.log('[useRoomSocket] Disconnected from server');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[useRoomSocket] Connection error:', error);
    });

    socket.on('error', (error) => {
      console.error('[useRoomSocket] Socket error:', error);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
    // Intentionally run only once on mount
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    // Store requested room; if socket already connected, emit immediately
    pendingRoomRef.current = roomId;
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('join-room', {
        roomId,
        deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop',
      });
      setCurrentRoom(roomId);
      pendingRoomRef.current = null;
    }
    // If not connected yet, the connect handler will join the pending room
  }, []);

  const sendAudioData = useCallback((frequencies: number[]) => {
    const roomToSend = currentRoom || pendingRoomRef.current;
    if (socketRef.current && isConnected && roomToSend) {
      try {
        console.debug('[useRoomSocket] sendAudioData', {
          room: roomToSend,
          length: Array.isArray(frequencies) ? frequencies.length : undefined,
        });
      } catch (err) {
        // ignore logging errors
      }

      socketRef.current.emit('audio-data', {
        frequencies,
        timestamp: Date.now(),
        roomId: roomToSend,
      });
    }
  }, [isConnected, currentRoom]);

  return {
    sendAudioData,
    connectedUsers,
    isConnected,
    clientId,
    joinRoom,
    currentRoom,
  };
};
