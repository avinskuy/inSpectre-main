import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev: frontend di :3000, backend di :5000. Request /api dan /socket.io diteruskan ke backend,
// jadi frontend cukup memakai path relatif (tanpa CORS & tanpa hardcode URL).
const BACKEND = process.env.VITE_PROXY_TARGET || 'http://localhost:5000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': { target: BACKEND, changeOrigin: true },
      '/socket.io': { target: BACKEND, ws: true, changeOrigin: true },
    },
  },
});
