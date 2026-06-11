import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
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
        'src/utils/**/*.{js,ts}',
        'src/services/**/*.{js,ts}'
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
        statements: 50,
        branches: 50,
        functions: 50,
        lines: 50
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
      '@services': resolve(__dirname, 'src/services'),
      '@store': resolve(__dirname, 'src/store')
    }
  }
})
