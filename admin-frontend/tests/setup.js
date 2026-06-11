/**
 * Admin-Frontend Test Setup
 * Vitest 全局测试配置
 */
import { config } from '@vue/test-utils'

// 设置 Vue Test Utils 全局配置
config.global.stubs = {
  transition: false,
  'router-link': true,
  'router-view': true
}

// Mock 全局的 fetch / localStorage
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  }
}
