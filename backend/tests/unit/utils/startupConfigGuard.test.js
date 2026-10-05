const {
  parseInsecureConfigWaivers,
  WAIVABLE_CHECKS,
  NON_WAIVABLE_CHECKS
} = require('../../../src/utils/startupConfigGuard');

describe('utils/startupConfigGuard - M-13 ALLOW_INSECURE_CONFIG 按项豁免', () => {
  it('未配置 / false / 空白 = 无任何豁免、无整体跳过', () => {
    for (const raw of [undefined, null, '', '   ', 'false', 'FALSE', '0', 'no', 'off']) {
      const r = parseInsecureConfigWaivers(raw);
      expect(r.blanket).toBe(false);
      expect(r.waivers.size).toBe(0);
      expect(r.notWaivable).toEqual([]);
      expect(r.unknown).toEqual([]);
    }
  });

  it('整体跳过值（true/1/all/* …）只记 blanket，不产生豁免', () => {
    for (const raw of ['true', 'TRUE', '1', 'yes', 'all', '*', 'on']) {
      const r = parseInsecureConfigWaivers(raw);
      expect(r.blanket).toBe(true);
      expect(r.waivers.size).toBe(0);
    }
  });

  it('按项豁免：仅命中显式列出的可豁免项（大小写/空白归一）', () => {
    const r = parseInsecureConfigWaivers('DB_PASSWORD, jwt_secret , PII_ENCRYPTION_KEY');
    expect(r.blanket).toBe(false);
    expect([...r.waivers].sort()).toEqual(['DB_PASSWORD', 'JWT_SECRET', 'PII_ENCRYPTION_KEY']);
    expect(r.unknown).toEqual([]);
    expect(r.notWaivable).toEqual([]);
  });

  it('不可豁免项（CORS/USE_MOCK_DB/限流）被单列，不进入 waivers', () => {
    const r = parseInsecureConfigWaivers('RATE_LIMIT_DISABLED,USE_MOCK_DB,CORS_ORIGIN');
    expect(r.waivers.size).toBe(0);
    expect(r.notWaivable.sort()).toEqual(['CORS_ORIGIN', 'RATE_LIMIT_DISABLED', 'USE_MOCK_DB']);
  });

  it('混合输入被正确分流：可豁免 / 不可豁免 / 无法识别', () => {
    const r = parseInsecureConfigWaivers('DB_PASSWORD,RATE_LIMIT_DISABLED,BOGUS,ADMIN_TOKEN');
    expect([...r.waivers].sort()).toEqual(['ADMIN_TOKEN', 'DB_PASSWORD']);
    expect(r.notWaivable).toEqual(['RATE_LIMIT_DISABLED']);
    expect(r.unknown).toEqual(['BOGUS']);
  });

  it('整体跳过值与显式项并存：blanket 置位，但显式项仍被识别', () => {
    const r = parseInsecureConfigWaivers('true,DB_PASSWORD');
    expect(r.blanket).toBe(true);
    expect([...r.waivers]).toEqual(['DB_PASSWORD']);
  });

  it('豁免项名与不可豁免项名无交集，且都非空', () => {
    expect(WAIVABLE_CHECKS.length).toBeGreaterThan(0);
    expect(NON_WAIVABLE_CHECKS.length).toBeGreaterThan(0);
    for (const k of WAIVABLE_CHECKS) expect(NON_WAIVABLE_CHECKS).not.toContain(k);
  });
});
