// 回归测试：Model.decrement 在 MySQL 下的返回结构与 Model.update 不同，
// 历史上调用方直接解构 res[0] 做判断，导致「礼物提现永远余额不足」「管理员提现不校验余额」两类事故。
// 这里锁死归一化行为，防止回归。

jest.mock('../../../src/config/mysql', () => ({
  literal: jest.fn((s) => ({ val: s })),
  escape: jest.fn((v) => v)
}));

const { affectedCount, assertFiniteNumber, moneyMinus, moneyPlus } = require('../../../src/utils/sql');

describe('Utils - SQL helpers', () => {
  describe('affectedCount', () => {
    it('兼容 Model.update 的返回结构 [N]', () => {
      expect(affectedCount([1])).toBe(1);
      expect(affectedCount([0])).toBe(0);
      expect(affectedCount([5])).toBe(5);
    });

    it('兼容 Model.decrement 在 MySQL 下的真实结构 [[null, N]]', () => {
      expect(affectedCount([[null, 1]])).toBe(1);
      expect(affectedCount([[null, 0]])).toBe(0);
      expect(affectedCount([[null, 3]])).toBe(3);
    });

    it('未命中时返回 0，且不等于 1（保证失败分支会被触发）', () => {
      expect(affectedCount([[null, 0]]) !== 1).toBe(true);
      expect(affectedCount([0]) !== 1).toBe(true);
      // 旧写法 Boolean([[null, 0]]) === true，永远进不了失败分支
      expect(Boolean([[null, 0]])).toBe(true);
    });

    it('异常输入不抛出，返回非 1 值', () => {
      expect(affectedCount([]) !== 1).toBe(true);
      expect(affectedCount(undefined) !== 1).toBe(true);
      expect(affectedCount(null) !== 1).toBe(true);
    });
  });

  describe('assertFiniteNumber', () => {
    it('接受数字与数字字符串', () => {
      expect(assertFiniteNumber(10)).toBe(10);
      expect(assertFiniteNumber('10.5')).toBe(10.5);
    });

    it('拒绝非有限数字', () => {
      expect(() => assertFiniteNumber('abc')).toThrow();
      expect(() => assertFiniteNumber(Infinity)).toThrow();
      expect(() => assertFiniteNumber(NaN)).toThrow();
    });
  });

  describe('moneyMinus / moneyPlus', () => {
    it('生成不含注入字符的字面量', () => {
      expect(moneyMinus('money', 10).val).toBe('money - 10');
      expect(moneyPlus('money', 2.5).val).toBe('money + 2.5');
    });

    it('非法金额被拒绝', () => {
      expect(() => moneyMinus('money', '1; DROP TABLE xn_user')).toThrow();
    });
  });
});
