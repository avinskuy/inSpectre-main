import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_ORIGIN } from './api.js';

// Socket hanya membawa statistik agregat publik; hasil scan individual tidak disiarkan.
export function useLiveFeed() {
  const [stats, setStats] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(API_ORIGIN, { transports: ['websocket', 'polling'] });
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('stats_update', setStats);

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, []);

  return { stats, connected };
}
