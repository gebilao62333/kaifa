import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { resolve } from 'path'

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5174,
    host: '0.0.0.0',
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            // 后端 JSON 缺少 charset 时，浏览器可能按 Latin-1 解码导致中文乱码
            const ct = proxyRes.headers['content-type']
            if (ct && ct.includes('application/json') && !ct.includes('charset')) {
              proxyRes.headers['content-type'] = 'application/json; charset=utf-8'
            }
          })
        }
      }
    }
  },
  build: {
    target: 'es2015'
  }
})
