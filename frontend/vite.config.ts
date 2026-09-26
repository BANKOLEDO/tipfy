import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Without VITE_API_URL the app falls back to the relative '/api/v1', which
  // only resolves if the host rewrites /api to the backend (see vercel.json).
  // Surface it at build time instead of shipping a silently broken app.
  if (mode === 'production' && !process.env.VITE_API_URL) {
    console.warn(
      '\n[tipfy] VITE_API_URL is not set. Falling back to the relative "/api/v1".\n' +
        '[tipfy] Make sure your host rewrites /api/* to the backend, or set VITE_API_URL.\n'
    )
  }

  return {
    plugins: [tailwindcss(), react()],
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
  }
})
