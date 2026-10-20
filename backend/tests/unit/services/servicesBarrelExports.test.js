// 导出契约防回归测试
// 背景：2026-10-21 线上 v1.0.8 验收发现 /api/user/pref、/api/user/skins 稳定 500：
// src/services/index.js 里 require 了 skinService，但 module.exports 漏写，
// controllers/user.js 从桶里解构出的 skinService 是 undefined，
// 读 skinService.STATE_KEY 直接抛 "Cannot read properties of undefined (reading 'STATE_KEY')"。
// 单元测试里 services 被 jest.mock 掉了，所以没拦住。这里固化「桶导出」契约。
const services = require('../../../src/services');

describe('导出契约 - services 桶', () => {
  it('桶里的每个导出值都已定义（不允许 require 了却漏导出）', () => {
    const undefinedNames = Object.entries(services)
      .filter(([, value]) => value === undefined)
      .map(([name]) => name);
    expect(undefinedNames).toEqual([]);
  });

  it('skinService 及其契约常量已从桶导出', () => {
    expect(services.skinService).toBeDefined();
    expect(services.skinService.STATE_KEY).toBe('skinShop');
    expect(typeof services.skinService.listForUser).toBe('function');
    expect(typeof services.skinService.purchase).toBe('function');
  });

  it('控制器从桶里解构的服务名都能取到', () => {
    const referenced = [
      'authService', 'smsService', 'levelService', 'skinService', 'chatService',
      'walletService', 'vipService', 'uploadService', 'mediaAssetService',
      'trtcService', 'callBillingService', 'reserveService', 'demandService',
      'reportService', 'circleService', 'cosSignedUrlService', 'payService',
      'wechatPayService', 'giftService', 'gamesService', 'feedbackService'
    ];
    const missing = referenced.filter((name) => services[name] === undefined);
    expect(missing).toEqual([]);
  });
});
