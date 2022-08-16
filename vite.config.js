/// <reference types="vitest" />

import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    dir: './src/tests',
    globals: true,
    environment: 'happy-dom',
  },
})