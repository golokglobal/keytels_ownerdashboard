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
//const BACKEND = 'http://localhost:8080';
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
      '/api/owner-billing': {
        target: 'http://localhost:8089',  // billing service
        // target: BACKEND,
        changeOrigin: true,
        secure: false,
        configure: stripWWWAuthenticate,
      },

      '/api/owners': {
        target: 'http://localhost:8083',  // auth service — owner data lives here
        // target: BACKEND,
        changeOrigin: true,
        secure: false,
        configure: stripWWWAuthenticate,
      },

      '/api/staff': {
        target: 'http://localhost:8083',  // staff service
        // target: BACKEND,
        changeOrigin: true,
        secure: false,
        configure: stripWWWAuthenticate,
      },

      '/api/hotel-managers': {
        target: 'http://localhost:8083',  // staff service
        // target: BACKEND,
        changeOrigin: true,
        secure: false,
        configure: stripWWWAuthenticate,
      },

      '/api/users': {
        // target: BACKEND,
        target: 'http://localhost:8084',
        changeOrigin: true,
        secure: false,
        configure: stripWWWAuthenticate,
      },

      '/api/partneredhotel': {
        // target: BACKEND,
        target: 'http://localhost:8084',
        changeOrigin: true,
        secure: false,
        configure: stripWWWAuthenticate,
      },

      '/api/hotels': {
        // target: BACKEND,
        target: 'http://localhost:8084',
        changeOrigin: true,
        secure: false,
        configure: stripWWWAuthenticate,
      },

      '/api/bookings': {
        // target: BACKEND,
        target: 'http://localhost:8084',
        changeOrigin: true,
        secure: false,
        configure: stripWWWAuthenticate,
      },

      '/partneredhotel': {
        // target: BACKEND,
        target: 'http://localhost:8084',
        changeOrigin: true,
        secure: false,
        configure: stripWWWAuthenticate,
      },

      '/users/admin': {
        // target: BACKEND,
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        configure: stripWWWAuthenticate,
      },

      '/auth': {
        // target: BACKEND,
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        configure: stripWWWAuthenticate,
      },

      // Generic fallback for anything else under /api (MUST be last)
      '/api': {
        // target: BACKEND,
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        configure: stripWWWAuthenticate,
      },
    },
  },
});
