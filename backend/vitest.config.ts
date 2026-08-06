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
    testTimeout: 30000,
    hookTimeout: 30000,
    // Test files share the same live Neon DB and each file wipes all 'test+'
    // rows in afterAll — run files serially so they can't delete each other's
    // in-flight data.
    fileParallelism: false,
    setupFiles: [resolve(__dirname, 'src/__tests__/setup.ts')],
    env: {
      RESEND_API_KEY: '',
    },
  },
})
