import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5173',
        changeOrigin: true,
        configure: (proxy, options) => {
          // For local development, API routes are handled by Vercel CLI
          // In production, Vercel automatically routes /api to serverless functions
        }
      }
    }
  }
})
