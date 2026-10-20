jest.mock('../../../src/config', () => {
  const os = require('os');
  const path = require('path');
  return {
    nodeEnv: 'test',
    pii: { encryptionKey: '', encryptionKeyPrevious: '' },
    paths: { logs: path.join(os.tmpdir(), 'dsh-mobile-test-logs') }
  };
});

const config = require('../../../src/config');
const pii = require('../../../src/utils/pii');
const mobileUtil = require('../../../src/utils/mobile');

const KEY = 'c'.repeat(64);

describe('utils/mobile 手机号加密与盲索引（B-7）', () => {
  afterEach(() => {
    config.pii.encryptionKey = '';
    config.nodeEnv = 'test';
  });

  it('规范化：去空格与连字符，空值返回空串', () => {
    expect(mobileUtil.normalize(' 138 0013-8000 ')).toBe('13800138000');
    expect(mobileUtil.normalize(null)).toBe('');
    expect(mobileUtil.normalize('')).toBe('');
  });

  it('盲索引：同一号码哈希稳定，不同号码不同，空号返回 null', () => {
    config.pii.encryptionKey = KEY;
    const a = mobileUtil.hashMobile('13800138000');
    const b = mobileUtil.hashMobile(' 138 0013-8000 ');
    const c = mobileUtil.hashMobile('13900139000');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toHaveLength(64);
    expect(mobileUtil.hashMobile('')).toBeNull();
  });

  it('写入字段：空号写 null（避免唯一下标冲突），有号写密文+hash 且可解密', () => {
    config.pii.encryptionKey = KEY;
    expect(mobileUtil.mobileFields('')).toEqual({ mobile: null, mobile_hash: null });

    const fields = mobileUtil.mobileFields('13800138000');
    expect(fields.mobile_hash).toBe(mobileUtil.hashMobile('13800138000'));
    expect(pii.looksEncrypted(fields.mobile)).toBe(true);
    expect(pii.decryptField(fields.mobile)).toBe('13800138000');
    expect(mobileUtil.decryptMobile(fields.mobile)).toBe('13800138000');
  });

  it('查询条件只带 mobile_hash；空号返回哨兵值而不是 NULL（防全表命中）', () => {
    config.pii.encryptionKey = KEY;
    expect(mobileUtil.buildMobileWhere('13800138000')).toEqual({
      mobile_hash: mobileUtil.hashMobile('13800138000')
    });
    // WHERE mobile_hash IS NULL 会命中所有未绑号用户，绝不能作为「按号查人」的条件
    expect(mobileUtil.buildMobileWhere('')).toEqual({ mobile_hash: '__invalid_mobile__' });
    expect(mobileUtil.buildMobileWhere('   ')).toEqual({ mobile_hash: '__invalid_mobile__' });
  });

  it('非生产缺密钥时使用可预测回退哈希（本地联调可用）', () => {
    expect(pii.isConfigured()).toBe(false);
    const h1 = mobileUtil.hashMobile('13800138000');
    const h2 = mobileUtil.hashMobile('13800138000');
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64);
  });

  it('生产缺密钥时哈希直接拒绝（不产生不可迁移的索引）', () => {
    config.nodeEnv = 'production';
    expect(() => mobileUtil.hashMobile('13800138000')).toThrow('PII_ENCRYPTION_KEY');
  });
});
