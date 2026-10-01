import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => ({
  // 生产构建用 /admin/（由 Nginx 托管在该子路径下）
  // 开发模式用 / 根路径，Vite dev server 直接在 5175 端口提供 SPA
  base: mode === 'production' ? '/admin/' : '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5175,
    host: '0.0.0.0',
    open: false,
    // 禁用 HMR：IDE 内置浏览器可能不支持 WebSocket，会引发 getBoundingClientRect 报错
    hmr: false,
    // 允许通过环境变量切换代理目标：
    //  - 本地开发（默认）：http://localhost:3000 → 后端直连
    //  - Docker 开发：VITE_API_TARGET=http://nginx:80
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:3000',
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
    minify: 'terser',
    terserOptions: {
      compress: {
        // 仅移除 console.log，保留 console.error/console.warn 用于生产错误排查
        pure_funcs: ['console.log', 'console.debug'],
        drop_debugger: true
      }
    }
  }
}))
