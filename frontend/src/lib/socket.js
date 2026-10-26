import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_ORIGIN } from './api.js';

/* Terhubung ke backend untuk menerima hasil scan & statistik secara real-time
   (dari situs ini maupun dari bot Telegram). */
export function useLiveFeed(limit = 6) {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(API_ORIGIN, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('new_threat', (e) => setEvents((prev) => [e, ...prev].slice(0, limit)));
    socket.on('stats_update', setStats);

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [limit]);

  return { events, stats, connected };
}
