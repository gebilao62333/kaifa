// 路由模块可加载性回归测试
// 背景：2026-10-03 安全加固时，routes/pay.js 引用了未从 middlewares/index.js 导出的
// cardLimiter，导致 Express 注册路由抛错 —— 整个 /api/pay 模块被 safeRequire 跳过，
// 17 个支付接口全部静默 404。而按控制器单测的方式完全发现不了。
// 这里把"每个路由文件都能 require 并产出可挂载的 router"固化成测试。
const fs = require('fs');
const path = require('path');

const ROUTES_DIR = path.resolve(__dirname, '../../../src/routes');

jest.mock('../../../src/models', () => {
  const handler = {
    get: () => new Proxy(function () {}, handler)
  };
  return new Proxy({}, handler);
});

describe('路由模块可加载性', () => {
  const files = fs.readdirSync(ROUTES_DIR).filter((f) => f.endsWith('.js') && f !== 'index.js');

  it('至少包含 20 个业务路由文件', () => {
    expect(files.length).toBeGreaterThanOrEqual(20);
  });

  it.each(files)('%s 可 require 且导出可挂载的 router', (file) => {
    const router = require(path.join(ROUTES_DIR, file));
    expect(router).toBeTruthy();
    // Express router 是函数且带 use/stack 属性
    expect(typeof router).toBe('function');
    expect(Array.isArray(router.stack)).toBe(true);
    expect(typeof router.use).toBe('function');
  });

  it('routes/index.js 可加载并导出 setup 函数', () => {
    const setupRoutes = require(path.join(ROUTES_DIR, 'index.js'));
    expect(typeof setupRoutes).toBe('function');
  });
});
