import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 브라우저 환경에서 global 에러 방지
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
  },

  server: {
    port: 3000,
    proxy: {
      // 👉 Spring API (REST)
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },

      // 👉 Spring WebSocket
      '/ws': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
        secure: false,
      },

      // 👉 FastAPI AI 서버
      '/ai': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
