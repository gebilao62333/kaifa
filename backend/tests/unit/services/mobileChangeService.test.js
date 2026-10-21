// P1-8 换绑手机号服务测试：双场景验证码、双码校验、盲索引查重、事务更新与全端下线。
jest.mock('../../../src/config', () => ({
  nodeEnv: 'test',
  pii: { encryptionKey: 'test-pii-key', encryptionKeyPrevious: '' },
  sms: { testMode: false, testPhones: [], returnCodeInDev: false, appId: '' }
}));

jest.mock('../../../src/models', () => ({
  User: { findByPk: jest.fn(), findOne: jest.fn() }
}));

// 短信与吊销都是外部依赖：这里只验证「调用约定」，不连 Redis / 真实通道
jest.mock('../../../src/services/smsService', () => ({
  SMS_SCENES: ['login', 'register', 'reset', 'bind_old', 'bind_new'],
  sendSMS: jest.fn(),
  verifyCode: jest.fn(),
  maskMobile: jest.fn((m) => String(m || '').replace(/^(\d{3})\d+(\d{4})$/, '$1****$2'))
}));

jest.mock('../../../src/services/tokenRevocation', () => ({
  revokeAllUserTokens: jest.fn(),
  revocationFailMode: jest.fn()
}));

jest.mock('../../../src/config/mysql', () => ({
  transaction: jest.fn()
}));

// logger 依赖 config.paths.logs（上面的 config mock 只给最小面），这里直接静音
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

const config = require('../../../src/config');
const sequelize = require('../../../src/config/mysql');
const { User } = require('../../../src/models');
const smsService = require('../../../src/services/smsService');
const tokenRevocation = require('../../../src/services/tokenRevocation');
const service = require('../../../src/services/mobileChangeService');

const makeUser = (overrides = {}) => ({
  id: 100001,
  mobile: '13800000000',
  update: jest.fn().mockResolvedValue(undefined),
  ...overrides
});

const makeTx = () => ({
  commit: jest.fn().mockResolvedValue(undefined),
  rollback: jest.fn().mockResolvedValue(undefined),
  finished: false
});

describe('mobileChangeService（P1-8 换绑手机号）', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    config.nodeEnv = 'test';
    User.findByPk.mockResolvedValue(makeUser());
    User.findOne.mockResolvedValue(null);
    smsService.sendSMS.mockResolvedValue({ success: true });
    smsService.verifyCode.mockResolvedValue(true);
    tokenRevocation.revokeAllUserTokens.mockResolvedValue({ ok: true, verifiable: true });
    tokenRevocation.revocationFailMode.mockReturnValue('open');
    sequelize.transaction.mockResolvedValue(makeTx());
  });

  describe('sendChangeCode', () => {
    it('新号格式非法时直接拒绝，不查库也不发码', async () => {
      await expect(service.sendChangeCode(100001, { newPhone: '123' }))
        .rejects.toMatchObject({ isBusinessError: true, code: 'INVALID_MOBILE' });
      expect(User.findByPk).not.toHaveBeenCalled();
      expect(smsService.sendSMS).not.toHaveBeenCalled();
    });

    it('旧号取自服务端当前账号，一次请求分别用 bind_old / bind_new 两个独立场景发码', async () => {
      smsService.sendSMS
        .mockResolvedValueOnce({ success: true, code: '111111' })
        .mockResolvedValueOnce({ success: true, code: '222222' });

      const data = await service.sendChangeCode(100001, { newPhone: '13900000000' });

      // 旧号来自解密后的账号资料，不信任请求体；两码写入不同场景 key
      expect(smsService.sendSMS.mock.calls).toEqual([
        ['13800000000', 'bind_old'],
        ['13900000000', 'bind_new']
      ]);
      expect(data).toEqual({
        maskedPhone: '138****0000',
        maskedNewPhone: '139****0000',
        devCodes: { oldCode: '111111', newCode: '222222' }
      });
    });

    it('生产环境即使短信层带回 code 也不回传 devCodes', async () => {
      config.nodeEnv = 'production';
      smsService.sendSMS.mockResolvedValue({ success: true, code: '111111' });

      const data = await service.sendChangeCode(100001, { newPhone: '13900000000' });

      expect(data.devCodes).toBeUndefined();
    });

    it('请求体 oldPhone 与当前绑定号不一致时拒绝', async () => {
      await expect(service.sendChangeCode(100001, { oldPhone: '13700000000', newPhone: '13900000000' }))
        .rejects.toMatchObject({ code: 'OLD_MOBILE_MISMATCH' });
      expect(smsService.sendSMS).not.toHaveBeenCalled();
    });

    it('新号已被占用时发码阶段不返回占用信息（防账号枚举）', async () => {
      User.findOne.mockResolvedValue({ id: 999 });
      smsService.sendSMS.mockResolvedValue({ success: true, code: '111111' });

      const data = await service.sendChangeCode(100001, { newPhone: '13900000000' });

      // 仍正常给旧号/新号发码，不因占用提前失败；占用判断留到双码校验之后
      expect(smsService.sendSMS).toHaveBeenCalledTimes(2);
      expect(data.maskedNewPhone).toBe('139****0000');
      expect(data).not.toHaveProperty('occupied');
    });

    it('新号与当前号相同时拒绝', async () => {
      await expect(service.sendChangeCode(100001, { newPhone: '13800000000' }))
        .rejects.toMatchObject({ code: 'SAME_MOBILE' });
    });

    it('当前账号未绑定手机号时拒绝', async () => {
      User.findByPk.mockResolvedValue(makeUser({ mobile: null }));
      await expect(service.sendChangeCode(100001, { newPhone: '13900000000' }))
        .rejects.toMatchObject({ code: 'MOBILE_NOT_BOUND' });
    });

    it('短信服务不可用映射为 503 业务码', async () => {
      smsService.sendSMS.mockRejectedValue(new Error('短信服务不可用'));
      await expect(service.sendChangeCode(100001, { newPhone: '13900000000' }))
        .rejects.toMatchObject({ code: 'SMS_UNAVAILABLE' });
    });
  });

  describe('changeMobile', () => {
    it('旧号+新号双码校验通过后，事务内写加密手机号并吊销全部会话', async () => {
      const user = makeUser();
      User.findByPk.mockResolvedValue(user);
      const tx = makeTx();
      sequelize.transaction.mockResolvedValue(tx);

      const result = await service.changeMobile(100001, {
        newPhone: '13900000000',
        oldCode: '111111',
        newCode: '222222'
      });

      expect(smsService.verifyCode.mock.calls).toEqual([
        ['13800000000', '111111', 'bind_old'],
        ['13900000000', '222222', 'bind_new']
      ]);
      expect(tokenRevocation.revokeAllUserTokens).toHaveBeenCalledWith(100001);
      // 手机号必须走 mobileFields：mobile 是 PII 密文、mobile_hash 是盲索引
      const updatePayload = user.update.mock.calls[0][0];
      expect(typeof updatePayload.mobile).toBe('string');
      expect(updatePayload.mobile).not.toBe('13900000000');
      expect(updatePayload.mobile_hash).toHaveLength(64);
      expect(user.update).toHaveBeenCalledWith(updatePayload, { transaction: tx });
      expect(tx.commit).toHaveBeenCalled();
      expect(result).toMatchObject({ requireRelogin: true, devicesRevoked: true, maskedPhone: '139****0000' });
    });

    it('旧号验证码错误时拒绝，不写库也不吊销会话', async () => {
      const user = makeUser();
      User.findByPk.mockResolvedValue(user);
      smsService.verifyCode.mockRejectedValueOnce(new Error('验证码错误'));

      await expect(service.changeMobile(100001, { newPhone: '13900000000', oldCode: '000000', newCode: '222222' }))
        .rejects.toMatchObject({ code: 'CODE_INVALID' });
      expect(tokenRevocation.revokeAllUserTokens).not.toHaveBeenCalled();
      expect(user.update).not.toHaveBeenCalled();
      expect(sequelize.transaction).not.toHaveBeenCalled();
    });

    it('缺少任一验证码时按业务错误拒绝', async () => {
      // 旧号码在前：缺旧号码时直接拒绝，不会先去校验新号码
      await expect(service.changeMobile(100001, { newPhone: '13900000000', oldCode: '', newCode: '222222' }))
        .rejects.toMatchObject({ code: 'CODE_REQUIRED' });
      expect(smsService.verifyCode).not.toHaveBeenCalled();
    });

    it('生产环境无法确认吊销时拒绝换号（fail-closed，不先改库）', async () => {
      config.nodeEnv = 'production';
      const user = makeUser();
      User.findByPk.mockResolvedValue(user);
      tokenRevocation.revokeAllUserTokens.mockResolvedValue({ ok: false, verifiable: false });
      tokenRevocation.revocationFailMode.mockReturnValue('closed');

      await expect(service.changeMobile(100001, { newPhone: '13900000000', oldCode: '111111', newCode: '222222' }))
        .rejects.toMatchObject({ code: 'REVOCATION_UNAVAILABLE' });
      expect(user.update).not.toHaveBeenCalled();
    });

    it('事务内复查发现新号被占用时回滚且不提交', async () => {
      const user = makeUser();
      User.findByPk.mockResolvedValue(user);
      const tx = makeTx();
      sequelize.transaction.mockResolvedValue(tx);
      // 双码校验后做一次占用检查（null），事务内复查命中他人
      User.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 999 });

      await expect(service.changeMobile(100001, { newPhone: '13900000000', oldCode: '111111', newCode: '222222' }))
        .rejects.toMatchObject({ code: 'MOBILE_TAKEN' });
      expect(tx.rollback).toHaveBeenCalled();
      expect(tx.commit).not.toHaveBeenCalled();
      expect(user.update).not.toHaveBeenCalled();
    });

    it('并发下唯一键冲突映射为「已被占用」并回滚', async () => {
      const user = makeUser();
      User.findByPk.mockResolvedValue(user);
      const tx = makeTx();
      sequelize.transaction.mockResolvedValue(tx);
      user.update.mockRejectedValue(Object.assign(new Error('Duplicate entry'), { name: 'SequelizeUniqueConstraintError' }));

      await expect(service.changeMobile(100001, { newPhone: '13900000000', oldCode: '111111', newCode: '222222' }))
        .rejects.toMatchObject({ code: 'MOBILE_TAKEN' });
      expect(tx.rollback).toHaveBeenCalled();
      expect(tx.commit).not.toHaveBeenCalled();
    });

    it('用户不存在时返回业务错误', async () => {
      User.findByPk.mockResolvedValue(null);
      await expect(service.changeMobile(100001, { newPhone: '13900000000', oldCode: '111111', newCode: '222222' }))
        .rejects.toMatchObject({ code: 'USER_NOT_FOUND' });
    });

    it('未绑定手机号时拒绝换号', async () => {
      User.findByPk.mockResolvedValue(makeUser({ mobile: null }));
      await expect(service.changeMobile(100001, { newPhone: '13900000000', oldCode: '111111', newCode: '222222' }))
        .rejects.toMatchObject({ code: 'MOBILE_NOT_BOUND' });
    });
  });
});
