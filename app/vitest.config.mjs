import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.js'],
    setupFiles: ['./tests/setup.js'],
    testTimeout: 10000
  },
  resolve: {
    alias: {
      // 必须排在 '@' 之前：避免较短前缀先命中，把 '@dcloudio/uni-app' 改写成 src 下的路径
      '@dcloudio/uni-app': resolve(__dirname, 'tests/mocks/uni-app.js'),
      '@': resolve(__dirname, 'src')
    }
  }
})
