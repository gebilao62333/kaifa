jest.mock('../../../src/config', () => {
  const os = require('os');
  const path = require('path');
  return {
    nodeEnv: 'test',
    pii: { encryptionKey: '', encryptionKeyPrevious: '' },
    paths: { logs: path.join(os.tmpdir(), 'dsh-pii-test-logs') }
  };
});

const config = require('../../../src/config');
const cryptoUtil = require('../../../src/utils/crypto');
const pii = require('../../../src/utils/pii');

const NEW_KEY = 'a'.repeat(64);
const OLD_KEY = 'b'.repeat(64);

describe('utils/pii 密钥轮换（B-9）', () => {
  afterEach(() => {
    config.pii.encryptionKey = '';
    config.pii.encryptionKeyPrevious = '';
    config.nodeEnv = 'test';
  });

  it('未配置密钥：非生产按明文透传，isConfigured=false', () => {
    expect(pii.isConfigured()).toBe(false);
    expect(pii.encryptField('张三')).toBe('张三');
    expect(pii.decryptField('张三')).toBe('张三');
    expect(pii.looksEncrypted('张三')).toBe(false);
  });

  it('配置密钥：加密-解密往返，密文形态可识别', () => {
    config.pii.encryptionKey = NEW_KEY;
    const cipher = pii.encryptField('110101199001011234');
    expect(pii.looksEncrypted(cipher)).toBe(true);
    expect(pii.decryptField(cipher)).toBe('110101199001011234');
    expect(pii.needsRotation(cipher)).toBe(false);
  });

  it('轮换窗口：旧钥密文可解，needsRotation=true；重加密后不再需要轮换', () => {
    const oldCipher = cryptoUtil.encrypt('张三', OLD_KEY);
    config.pii.encryptionKey = NEW_KEY;
    config.pii.encryptionKeyPrevious = OLD_KEY;

    expect(pii.decryptField(oldCipher)).toBe('张三');
    expect(pii.needsRotation(oldCipher)).toBe(true);

    const rotated = pii.encryptField(pii.decryptField(oldCipher));
    expect(pii.needsRotation(rotated)).toBe(false);
    expect(pii.decryptField(rotated)).toBe('张三');
  });

  it('旧钥缺失时旧密文解不出（空值而不是乱码），不误报轮换', () => {
    const oldCipher = cryptoUtil.encrypt('张三', OLD_KEY);
    config.pii.encryptionKey = NEW_KEY;

    expect(pii.decryptField(oldCipher)).toBe('');
    expect(pii.needsRotation(oldCipher)).toBe(false);
  });

  it('生产环境缺密钥时 encryptField 直接拒绝明文落库', () => {
    config.nodeEnv = 'production';
    expect(() => pii.encryptField('张三')).toThrow('PII_ENCRYPTION_KEY');
  });
});
