import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isBackendMode = process.env.VITE_DATA_MODE === 'backend';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    ...(isBackendMode ? {
      proxy: {
        '/api': {
          target: 'http://localhost:3002',
          changeOrigin: true,
          ws: true
        }
      }
    } : {})
  }
});


