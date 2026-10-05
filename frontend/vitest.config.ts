import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  // 视图组件测试需要编译 .vue 单文件组件
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: [
        'src/store/**/*.{js,ts}',
        'src/common/**/*.{js,ts}',
        'src/tools/**/*.{js,ts}'
      ],
      exclude: [
        'node_modules/',
        'src/main.js',
        'src/App.vue',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/dist/**',
        'src/**/*.vue'
      ],
      thresholds: {
        statements: 75,
        branches: 75,
        functions: 75,
        lines: 75
      }
    },
    setupFiles: ['./tests/setup.js'],
    testTimeout: 10000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@static': resolve(__dirname, 'src/static')
    }
  }
})
