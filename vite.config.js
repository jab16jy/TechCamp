import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const API_TARGET = 'http://localhost:80'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@features': path.resolve(__dirname, 'src/features'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@assets': path.resolve(__dirname, 'src/assets'),
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      // ── Core paths ──
      '/municipalities':       { target: API_TARGET, changeOrigin: true },
      '/analyze-location':     { target: API_TARGET, changeOrigin: true },
      '/climate':              { target: API_TARGET, changeOrigin: true },
      '/satellite-indicators': { target: API_TARGET, changeOrigin: true },
      '/chat':                 { target: API_TARGET, changeOrigin: true },
      '/predict':              { target: API_TARGET, changeOrigin: true },
      '/health':               { target: API_TARGET, changeOrigin: true },
      '/tasks':                { target: API_TARGET, changeOrigin: true },

      // ── Grouped prefixes ──
      '/history':         { target: API_TARGET, changeOrigin: true },
      '/analysis':        { target: API_TARGET, changeOrigin: true },
      '/auth':            { target: API_TARGET, changeOrigin: true },
      '/sensors':         { target: API_TARGET, changeOrigin: true },
      '/geo':             { target: API_TARGET, changeOrigin: true },
      '/reports':         { target: API_TARGET, changeOrigin: true },
      '/dashboard':       { target: API_TARGET, changeOrigin: true },
      '/soil':            { target: API_TARGET, changeOrigin: true },
      '/irrigation-plans': { target: API_TARGET, changeOrigin: true },
    },
  },
})
