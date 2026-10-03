// 导出契约防回归测试
// 背景：2026-10-03 清理 giftService 死代码时曾误删 sendRedPacket 的导出，
// 导致 POST /api/gift/redpacket/send 在运行期报 "giftService.sendRedPacket is not a function"。
// 这里把「路由/控制器实际调用的导出」固化成契约。
const giftService = require('../../../src/services/giftService');
const giftController = require('../../../src/controllers/gift');

describe('导出契约 - giftService / giftController', () => {
  const REQUIRED_SERVICE_EXPORTS = [
    'sendGift', 'getGiftList', 'getGiftBag', 'withdraw',
    'sendRedPacket', 'receiveRedPacket', 'getRedPacketHistory'
  ];

  it('giftService 暴露路由依赖的全部方法', () => {
    for (const name of REQUIRED_SERVICE_EXPORTS) {
      expect(typeof giftService[name]).toBe('function');
    }
  });

  it('giftController 暴露 routes/gift.js 引用的全部处理函数', () => {
    const required = [
      'getGiftList', 'sendGift', 'getGiftBag', 'withdraw',
      'sendRedPacket', 'receiveRedPacket', 'getRedPacketHistory'
    ];
    for (const name of required) {
      expect(typeof giftController[name]).toBe('function');
    }
  });

  it('已删除的越权提现审核接口不再被导出', () => {
    for (const name of ['getWithdrawList', 'approveWithdraw', 'rejectWithdraw']) {
      expect(giftController[name]).toBeUndefined();
    }
  });
});
