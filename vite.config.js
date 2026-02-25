// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Strips WWW-Authenticate header so the browser never shows the native Basic Auth popup
const stripWWWAuthenticate = (proxy) => {
  proxy.on('proxyRes', (proxyRes) => {
    delete proxyRes.headers['www-authenticate'];
  });
};

const BACKEND = 'https://desiney.berymo.com';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    proxy: {
      // ───────────────────────────────────────────────
      // IMPORTANT: Specific routes MUST come before generic fallback
      // ───────────────────────────────────────────────
      '/api/owners': {
        target: BACKEND,
        changeOrigin: true,
        secure: false,
        configure: stripWWWAuthenticate,
      },

      '/api/staff': {
        target: BACKEND,
        changeOrigin: true,
        secure: false,
        configure: stripWWWAuthenticate,
      },

      '/api/users': {
        target: BACKEND,
        changeOrigin: true,
        secure: false,
        configure: stripWWWAuthenticate,
      },

      '/api/partneredhotel': {
        target: BACKEND,
        changeOrigin: true,
        secure: false,
        configure: stripWWWAuthenticate,
      },

      '/api/hotels': {
        target: BACKEND,
        changeOrigin: true,
        secure: false,
        configure: stripWWWAuthenticate,
      },

      '/api/bookings': {
        target: BACKEND,
        changeOrigin: true,
        secure: false,
        configure: stripWWWAuthenticate,
      },

      '/partneredhotel': {
        target: BACKEND,
        changeOrigin: true,
        secure: false,
        configure: stripWWWAuthenticate,
      },

      '/users/admin': {
        target: BACKEND,
        changeOrigin: true,
        secure: false,
        configure: stripWWWAuthenticate,
      },

      '/auth': {
        target: BACKEND,
        changeOrigin: true,
        secure: false,
        configure: stripWWWAuthenticate,
      },

      // Generic fallback for anything else under /api (MUST be last)
      '/api': {
        target: BACKEND,
        changeOrigin: true,
        secure: false,
        configure: stripWWWAuthenticate,
      },
    },
  },
});
