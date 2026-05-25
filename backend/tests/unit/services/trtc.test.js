const { trtcService } = require('../../../src/services');

describe('TRTC服务', () => {
  describe('generateUserSig', () => {
    it('当配置缺失时应该返回null', () => {
      const result = trtcService.generateUserSig(12345);
      expect(result).toBe(null);
    });
  });

  describe('generateRoomId', () => {
    it('应该生成房间ID', () => {
      const roomId = trtcService.generateRoomId(1001, 2002);

      expect(roomId).toBeDefined();
      expect(roomId).toBe('1001-2002');
    });

    it('应该保持房间ID一致性', () => {
      const roomId1 = trtcService.generateRoomId(1001, 2002);
      const roomId2 = trtcService.generateRoomId(2002, 1001);

      expect(roomId1).toBe(roomId2);
    });
  });

  describe('generateRoomSig', () => {
    it('当配置缺失时应该返回null', () => {
      const result = trtcService.generateRoomSig('1001-2002', 1001);
      expect(result).toBe(null);
    });
  });

  describe('verifyUserSig', () => {
    it('应该拒绝无效的UserSig', () => {
      const result = trtcService.verifyUserSig('invalid-signature');
      expect(result).toBe(false);
    });

    it('应该拒绝空签名', () => {
      const result = trtcService.verifyUserSig('');
      expect(result).toBe(false);
    });

    it('应该拒绝null签名', () => {
      const result = trtcService.verifyUserSig(null);
      expect(result).toBe(false);
    });
  });

  describe('getMeetingInfo', () => {
    it('应该返回会议信息', () => {
      const result = trtcService.getMeetingInfo('room-123');

      expect(result).toBeDefined();
      expect(result.roomId).toBe('room-123');
      expect(result.serverTime).toBeDefined();
    });
  });
});