const SERVICE_PATH = '../../../src/services/trtcService';

// 黄金测试向量：由腾讯官方 npm 包 tls-sig-api-v2@1.0.2 在冻结时钟下生成，
// 与本项目实现逐字节比对通过。若算法被改坏，这些断言会立刻失败。
// 生成条件：APP_ID=1400000001，SECRET=test-secret-key-0123456789，
//           UID=user-123，时间戳=1700000000（2023-11-15 06:13:20 UTC）
const FIXED_TIME = 1700000000;
const APP_ID = '1400000001';
const SECRET = 'test-secret-key-0123456789';
const USER_ID = 'user-123';
const ROOM_ID = '1001-2002';

const EXPECTED_USER_SIG =
  'eJyrVgrxCdYrSy1SslIy0jNQ0gHzM1NS80oy0zLBwqXFqUW6hkbGULnilOzEgoLMFCUrQxMDCDCEyJRk5qYqWRmaQ0UNIKKpFQWZRalKVhZmJjCh4sx0JSul4AyT0Hw-Ryff1ExXj9yM9LS0HH*TwKAMnzzTrPxg40pzs8gwd88Sz3L-dFulWgDxZjFE';
const EXPECTED_ROOM_SIG =
  'eJw1jskOgjAURf-lbR0oOGCauChgjGiJhAbYKhStVYOAAjH*u2E6q-vOTW7eF9jBm354Bhi0KYJxe4uYPwuRiFa-c55NVG3Wd3ksT2kqYsDqHHWoXVOIBwes6r1FneVVKjIOeLYcTDN4fieAgbhkF4fOPRKoojeHRXJukIatz5SqCZZCOmzKSEk9VFOL1MMr4gIYkG0WRnk0-Jt5DTwuQ8UNot31IoOXtVnsK6nn6WoU0sgu1-D7A6pZRvA_';

describe('TRTC服务', () => {
  describe('未配置 TRTC 密钥时', () => {
    let trtcService;

    beforeAll(() => {
      delete process.env.TRTC_APP_ID;
      delete process.env.TRTC_SECRET_KEY;
      jest.resetModules();
      trtcService = require(SERVICE_PATH);
    });

    it('generateUserSig 应返回 null（不抛出）', () => {
      expect(trtcService.generateUserSig(12345)).toBe(null);
    });

    it('generateRoomSig 应返回 null（不抛出）', () => {
      expect(trtcService.generateRoomSig('1001-2002', 1001)).toBe(null);
    });

    it('verifyUserSig 对无效/空/null 签名一律拒绝', () => {
      expect(trtcService.verifyUserSig('invalid-signature')).toBe(false);
      expect(trtcService.verifyUserSig('')).toBe(false);
      expect(trtcService.verifyUserSig(null)).toBe(false);
    });
  });

  describe('generateRoomId', () => {
    const trtcService = require(SERVICE_PATH);

    it('应该生成房间ID', () => {
      expect(trtcService.generateRoomId(1001, 2002)).toBe('1001-2002');
    });

    it('应该保持房间ID一致性', () => {
      expect(trtcService.generateRoomId(1001, 2002)).toBe(trtcService.generateRoomId(2002, 1001));
    });
  });

  describe('已配置 TRTC 密钥时（官方 TLSSigAPIv2 算法）', () => {
    let trtcService;

    beforeAll(() => {
      process.env.TRTC_APP_ID = APP_ID;
      process.env.TRTC_SECRET_KEY = SECRET;
      jest.resetModules();
      trtcService = require(SERVICE_PATH);
    });

    afterAll(() => {
      delete process.env.TRTC_APP_ID;
      delete process.env.TRTC_SECRET_KEY;
      jest.resetModules();
    });

    beforeEach(() => {
      // setup.js 的 afterEach 会 restoreAllMocks，因此每个用例前重新冻结时钟
      jest.spyOn(Date, 'now').mockReturnValue(FIXED_TIME * 1000);
    });

    it('generateUserSig 输出与腾讯官方实现逐字节一致', () => {
      const result = trtcService.generateUserSig(USER_ID, 86400, FIXED_TIME);
      expect(result.userSig).toBe(EXPECTED_USER_SIG);
      expect(result.userId).toBe(USER_ID);
      expect(result.appId).toBe(Number(APP_ID));
      expect(result.expireTime).toBe(FIXED_TIME + 86400);
    });

    it('generateUserSig 未注入时间时使用当前时间且默认 86400 秒', () => {
      const result = trtcService.generateUserSig(USER_ID);
      expect(result.expireTime).toBe(FIXED_TIME + 86400);
      expect(result.userSig).toBe(EXPECTED_USER_SIG);
    });

    it('generateRoomSig 输出与腾讯官方 PrivateMapKey 一致', () => {
      expect(trtcService.generateRoomSig(ROOM_ID, USER_ID, 3600)).toBe(EXPECTED_ROOM_SIG);
    });

    it('verifyUserSig 接受合法的 UserSig 与 RoomSig', () => {
      expect(trtcService.verifyUserSig(EXPECTED_USER_SIG)).toBe(true);
      expect(trtcService.verifyUserSig(EXPECTED_ROOM_SIG)).toBe(true);
    });

    it('verifyUserSig 拒绝被篡改的签名', () => {
      const tampered = EXPECTED_USER_SIG.slice(0, -4) + 'AAAA';
      expect(trtcService.verifyUserSig(tampered)).toBe(false);
    });

    it('verifyUserSig 拒绝过期签名', () => {
      // 过期时间 = FIXED_TIME + 86400，把时钟拨到之后
      jest.spyOn(Date, 'now').mockReturnValue((FIXED_TIME + 86400 + 10) * 1000);
      expect(trtcService.verifyUserSig(EXPECTED_USER_SIG)).toBe(false);
    });

    it('verifyUserSig 拒绝非法结构', () => {
      expect(trtcService.verifyUserSig('not-a-real-sig-but-long-enough-1234567890')).toBe(false);
    });

    it('签名使用腾讯自定义 Base64URL 变体（不含 + / = 字符）', () => {
      const sig = trtcService.generateUserSig(USER_ID, 86400, FIXED_TIME).userSig;
      expect(sig).not.toMatch(/[+/=]/);
      expect(sig).toMatch(/[*\-_]/);
    });
  });

  describe('getMeetingInfo', () => {
    const trtcService = require(SERVICE_PATH);

    it('应该返回会议信息', () => {
      const result = trtcService.getMeetingInfo('room-123');
      expect(result).toBeDefined();
      expect(result.roomId).toBe('room-123');
      expect(result.serverTime).toBeDefined();
    });
  });
});
