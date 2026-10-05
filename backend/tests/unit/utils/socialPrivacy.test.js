jest.mock('../../../src/models', () => ({
  ChatLog: { findOne: jest.fn() },
  ChatSession: { findOne: jest.fn() }
}));

const { ChatLog, ChatSession } = require('../../../src/models');
const {
  resolveSelfScope,
  hasChatRelationship,
  parseId,
  PRIVATE_SCOPE,
  INVALID_ID
} = require('../../../src/utils/socialPrivacy');

describe('utils/socialPrivacy - M-11 社交关系隐私', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('parseId', () => {
    it('接受十进制正整数串', () => {
      expect(parseId('12')).toBe(12);
      expect(parseId(7)).toBe(7);
      expect(parseId(' 42 ')).toBe(42);
    });

    it('拒绝科学计数法/十六进制/负数/小数/空白/超长/非数字', () => {
      expect(parseId('1e5')).toBeNull();
      expect(parseId('0x10')).toBeNull();
      expect(parseId('-1')).toBeNull();
      expect(parseId('12.5')).toBeNull();
      expect(parseId('')).toBeNull();
      expect(parseId('   ')).toBeNull();
      expect(parseId('0')).toBeNull();
      expect(parseId('abc')).toBeNull();
      expect(parseId('99999999999999999999')).toBeNull();
    });
  });

  describe('resolveSelfScope', () => {
    it('缺省（未传 userId）= 本人', () => {
      expect(resolveSelfScope(undefined, 5)).toEqual({ ok: true, userId: 5 });
      expect(resolveSelfScope(null, 5)).toEqual({ ok: true, userId: 5 });
      expect(resolveSelfScope('', 5)).toEqual({ ok: true, userId: 5 });
    });

    it('显式传本人 ID（字符串或数字）= 允许', () => {
      expect(resolveSelfScope('5', 5)).toEqual({ ok: true, userId: 5 });
      expect(resolveSelfScope(5, 5)).toEqual({ ok: true, userId: 5 });
    });

    it('显式传他人 ID = 拒绝（PRIVATE_SCOPE）', () => {
      expect(resolveSelfScope('6', 5)).toEqual({ ok: false, reason: PRIVATE_SCOPE });
      expect(resolveSelfScope(999, 5)).toEqual({ ok: false, reason: PRIVATE_SCOPE });
    });

    it('格式非法 = 拒绝（INVALID_ID，优先于越权判定）', () => {
      expect(resolveSelfScope('1e5', 5)).toEqual({ ok: false, reason: INVALID_ID });
      expect(resolveSelfScope('abc', 5)).toEqual({ ok: false, reason: INVALID_ID });
      expect(resolveSelfScope('12.5', 5)).toEqual({ ok: false, reason: INVALID_ID });
      expect(resolveSelfScope('0', 5)).toEqual({ ok: false, reason: INVALID_ID });
    });
  });

  describe('hasChatRelationship', () => {
    it('存在会话行 = 有关系（含反向）', async () => {
      ChatSession.findOne.mockResolvedValue({ id: 1 });
      ChatLog.findOne.mockResolvedValue(null);
      await expect(hasChatRelationship(5, 6)).resolves.toBe(true);
      // 双向都查：Op.or 同时覆盖 (self,peer) 与 (peer,self)
      const where = ChatSession.findOne.mock.calls[0][0].where;
      expect(JSON.stringify(where)).toContain('user_id');
      expect(JSON.stringify(where)).toContain('virtual_user_id');
    });

    it('存在聊天记录 = 有关系', async () => {
      ChatSession.findOne.mockResolvedValue(null);
      ChatLog.findOne.mockResolvedValue({ id: 9 });
      await expect(hasChatRelationship(5, 6)).resolves.toBe(true);
    });

    it('既无会话也无聊天记录 = 无关系（用于阻断在线枚举）', async () => {
      ChatSession.findOne.mockResolvedValue(null);
      ChatLog.findOne.mockResolvedValue(null);
      await expect(hasChatRelationship(5, 6)).resolves.toBe(false);
    });
  });
});
