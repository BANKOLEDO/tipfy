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
    // Only the TypeScript sources. Without this, `tsc` output in dist/ is also
    // matched, so every suite runs twice against the same live database.
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules/**', 'dist/**'],
    // Every suite shares one database and each file's afterAll truncates it, so
    // parallel files would delete each other's fixtures mid-run. Serial only.
    fileParallelism: false,
    setupFiles: [resolve(__dirname, 'src/__tests__/setup.ts')],
    env: {
      // Truthy so the 2FA and reset paths actually run, but a value Resend
      // would reject. Combined with the `resend` module mock in the suites,
      // no test can send a real email even if the mock is removed.
      RESEND_API_KEY: 're_test_not_a_real_key',
    },
  },
})
