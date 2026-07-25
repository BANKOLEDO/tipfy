import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '~': resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    testTimeout: 15000,
    hookTimeout: 30000,
    setupFiles: [resolve(__dirname, 'src/__tests__/setup.ts')],
  },
})
