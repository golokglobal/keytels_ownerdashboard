// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
         // ← changed to standard Vite port (optional but cleaner)

    proxy: {
      // ───────────────────────────────────────────────
      // IMPORTANT: Specific routes MUST come before generic fallback
      // Most important: Authentication & staff endpoints on port 8083
      // ───────────────────────────────────────────────
      '/api/owners': {
   //  target: 'http://localhost:8083',
target: 'https://desiney.berymo.com', // ← adjust to correct auth server if needed
        changeOrigin: true,
        secure: false,
      },

      '/api/staff': {
      //  target: 'http://localhost:8083',
        target: 'https://desiney.berymo.com', // ← adjust to correct auth server if needed
      changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // keeps /api/staff/...
      },

      '/api/users': {
      //  target: 'http://localhost:8083', // or 8080 — adjust based on where /users/register lives
       target: 'https://desiney.berymo.com', // ← adjust to correct auth server if needed
        changeOrigin: true,
        secure: false,
      },

      // ───────────────────────────────────────────────
      // Other specific prefixes (keep or adjust ports)
      // ───────────────────────────────────────────────
      '/api/partneredhotel': {
       // target: 'http://localhost:8084',
        target: 'https://desiney.berymo.com',
        changeOrigin: true,
        secure: false,
      },

      '/api/hotels': {
       // target: 'http://localhost:8084',
        target: 'https://desiney.berymo.com',
        changeOrigin: true,
        secure: false,
      },

      '/api/bookings': {
       // target: 'http://localhost:8084',
        target: 'https://desiney.berymo.com',
        changeOrigin: true,
        secure: false,
      },

      '/partneredhotel': {   // non-api version if frontend ever calls it this way
       // target: 'http://localhost:8084',
        target: 'https://desiney.berymo.com',
        changeOrigin: true,
        secure: false,
      },

      '/users/admin': {
       // target: 'http://localhost:8082',
        target: 'https://desiney.berymo.com',
        changeOrigin: true,
        secure: false,
      },

      // If you have /auth endpoints (some apps use /auth/login instead of /api/...)
      '/auth': {
       // target: 'http://localhost:8083', // ← adjust to correct auth server
        target: 'https://desiney.berymo.com', // ← adjust to correct auth server if needed
        changeOrigin: true,
        secure: false,
      },

      // Generic fallback for anything else under /api (MUST be last)
      '/api': {
        //target: 'http://localhost:8080', // or 8083 — choose the most common one
        target: 'https://desiney.berymo.com', // ← adjust to correct server if needed
        changeOrigin: true,
        secure: false,
      },
    },
  },
});