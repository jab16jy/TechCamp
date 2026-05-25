import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const API_TARGET = 'http://localhost:8000'

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
      '/municipalities':       API_TARGET,
      '/analyze-location':     API_TARGET,
      '/climate':              API_TARGET,
      '/satellite-indicators': API_TARGET,
      '/chat':                 API_TARGET,
      '/predict':              API_TARGET,
      '/health':               API_TARGET,
      '/tasks':                API_TARGET,

      // ── Grouped prefixes ──
      '/history':         API_TARGET,
      '/analysis':        API_TARGET,
      '/auth':            API_TARGET,
      '/sensors':         API_TARGET,
      '/geo':             API_TARGET,
      '/reports':         API_TARGET,
      '/dashboard':       API_TARGET,
      '/soil':            API_TARGET,
      '/irrigation-plans': API_TARGET,
    },
  },
})
