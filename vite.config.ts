import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    // Generates src/routeTree.gen.ts on dev and build. Left out of tests: the
    // generated file is committed, and the plugin's watcher keeps workers from starting.
    mode === 'test' ? null : tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Same-origin API in development: the session cookie and <img> URLs just work.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  test: {
    environment: 'jsdom',
    // jsdom's default origin is localhost:3000, where the real API runs in development.
    environmentOptions: { jsdom: { url: 'http://mybricks.test' } },
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // Every test renders the whole route tree in jsdom; one worker per core starves them and the
    // slowest time out, so the suite runs on a few workers and stays deterministic.
    maxWorkers: 4,
    // The property page fetches a dozen things; the default 5 seconds is too tight for it under load.
    testTimeout: 15_000,
  },
}))
