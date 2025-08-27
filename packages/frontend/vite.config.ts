import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for the frontend.  The dev server proxies API
// requests to the backend (running by default on port 3000) so that
// calls to `/api/...` work without CORS issues during development.

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});