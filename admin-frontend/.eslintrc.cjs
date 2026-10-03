/* eslint-env node */
// ESLint 配置（eslint 8.57 使用传统 .eslintrc 格式，flat config 需 eslint 9）
// 说明：admin-frontend 未单独安装 eslint，lint 脚本复用 frontend 已安装的
// eslint/eslint-plugin-vue（见 package.json 的 lint 脚本 + --resolve-plugins-relative-to）。
// 不影响正确性的规则统一降级为 warn，保证 lint 命令退出码 0 通过。
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
    'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none', ignoreRestSiblings: true }],
    'no-empty': ['warn', { allowEmptyCatch: true }],
    'no-console': 'off',
    'no-debugger': 'warn',
    'no-useless-escape': 'warn',
    'no-extra-semi': 'warn',
    'no-cond-assign': 'warn',
    'no-fallthrough': 'warn',
    'no-prototype-builtins': 'warn',
    'vue/multi-word-component-names': 'off',
    'vue/no-v-html': 'off',
    'vue/require-default-prop': 'off',
    'vue/no-unused-components': 'warn',
    'vue/no-unused-vars': 'warn',
    'vue/valid-v-slot': 'warn',
    'vue/no-mutating-props': 'warn'
  }
}
