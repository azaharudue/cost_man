import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'dashboard': ['./src/views/dashboard.js'],
          'details': ['./src/views/details.js'],
          'calendar': ['./src/views/calendar.js'],
          'utils': ['./src/utils.js']
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
})
