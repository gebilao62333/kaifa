import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@static': resolve(__dirname, 'src/static')
    }
  },
  server: {
    port: 5174,
    host: '0.0.0.0',
    open: false,
    // 禁用 HMR：IDE 内置浏览器可能不支持 WebSocket，会引发 getBoundingClientRect 报错（与 admin-frontend 一致）
    hmr: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            // 确保后端返回的 Content-Type 保留 charset=utf-8，防止中文乱码
            const ct = proxyRes.headers['content-type'];
            if (ct && ct.includes('application/json') && !ct.includes('charset')) {
              proxyRes.headers['content-type'] = 'application/json; charset=utf-8';
            }
          });
        }
      }
    }
  },
  build: {
    target: 'es2015',
    cssCodeSplit: true,
    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger']
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue']
        }
      }
    }
  }
})
