import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    proxy: {
      '/students': 'http://localhost:8000/api/v1',
      '/chat': 'http://localhost:8000/api/v1',
      '/interventions': 'http://localhost:8000/api/v1',
      '/ingest': 'http://localhost:8000/api/v1',
      '/demo': 'http://localhost:8000/api/v1',
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.ts',
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
  },
})

