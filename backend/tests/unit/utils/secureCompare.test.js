const { safeEqual } = require('../../../src/utils/secureCompare');

// 审计 M-3：口令/令牌等密文比较统一走常数时间实现，本套用例锁住其「语义等价于 ===，
// 但不会因长度不同/首个不同字节而早退」的行为边界。
describe('Utils - secureCompare', () => {
  it('相同字符串返回 true', () => {
    expect(safeEqual('fixed-admin-token', 'fixed-admin-token')).toBe(true);
  });

  it('等长但内容不同返回 false（不会在首个不同字节处提前判负）', () => {
    expect(safeEqual('envpass7', 'envpass8')).toBe(false);
    expect(safeEqual('aaaaaaaa', 'aaaaaaab')).toBe(false);
  });

  it('长度不同也返回 false，而不是抛错或短路', () => {
    expect(safeEqual('abc', 'abcd')).toBe(false);
    expect(safeEqual('', 'x')).toBe(false);
  });

  it('任意一侧为空/未定义时按空串处理，不抛错', () => {
    expect(safeEqual('', '')).toBe(true);
    expect(safeEqual(null, '')).toBe(true);
    expect(safeEqual(undefined, undefined)).toBe(true);
    expect(safeEqual(null, 'x')).toBe(false);
  });

  it('先做定长摘要，非字符串输入按字符串归一比较', () => {
    expect(safeEqual(123, '123')).toBe(true);
    expect(safeEqual(0, '0')).toBe(true);
    expect(safeEqual(123, '124')).toBe(false);
  });
});
