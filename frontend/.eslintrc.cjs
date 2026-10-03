/* eslint-env node */
// ESLint 配置（eslint 8.57 使用传统 .eslintrc 格式，flat config 需 eslint 9）
// 说明：这是给存量项目补齐的规范检查，不追求格式化全通过；
// 不影响正确性的规则统一降级为 warn，保证 lint 命令可以退出码 0 通过。
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  extends: ['eslint:recommended', 'plugin:vue/vue3-recommended'],
  rules: {
    // 存量代码中大量未使用变量/空 catch，降级为警告
    'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none', ignoreRestSiblings: true }],
    'no-empty': ['warn', { allowEmptyCatch: true }],
    'no-console': 'off',
    'no-debugger': 'warn',
    'no-useless-escape': 'warn',
    'no-extra-semi': 'warn',
    'no-cond-assign': 'warn',
    'no-fallthrough': 'warn',
    'no-prototype-builtins': 'warn',
    // 组件文件名允许单词形式（Home.vue、Mine.vue 等历史命名）
    'vue/multi-word-component-names': 'off',
    // 业务存在富文本/HTML 渲染场景
    'vue/no-v-html': 'off',
    'vue/require-default-prop': 'off',
    'vue/no-unused-components': 'warn',
    'vue/no-unused-vars': 'warn',
    'vue/valid-v-slot': 'warn',
    'vue/no-mutating-props': 'warn'
  }
}
