'use client';

import { useEffect } from 'react';

/**
 * Initialize Socket.IO on page load
 * This component ensures the WebSocket connection is established
 */
export default function SocketInitializer() {
  useEffect(() => {
    // Initialize socket connection by calling the API
    const initSocket = async () => {
      try {
        await fetch('/api/socket');
        console.log('[SocketInitializer] Socket initialized');
      } catch (error) {
        console.log('[SocketInitializer] Socket already initialized or network error');
      }
    };

    initSocket();
  }, []);

  return null;
}
