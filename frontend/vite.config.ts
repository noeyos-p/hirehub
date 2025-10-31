import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ✅ sockjs-client 등 Node 전역(global) 참조 오류 방지
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window', // 🔥 브라우저에서 global을 window로 대체
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
