const trtcController = require('../../../src/controllers/trtc');

jest.mock('../../../src/services', () => ({
  trtcService: {
    generateUserSig: jest.fn(),
    createRoom: jest.fn(),
    enterRoom: jest.fn(),
    leaveRoom: jest.fn(),
    getRoomInfo: jest.fn(),
    resolveRoomCall: jest.fn(),
    requireEnterableRoom: jest.fn(),
    startBilling: jest.fn(),
    endBilling: jest.fn()
  },
  callBillingService: {
    startCall: jest.fn(),
    cancelCall: jest.fn(),
    rejectCall: jest.fn(),
    acceptCall: jest.fn(),
    endCall: jest.fn(),
    getCallHistory: jest.fn()
  }
}));

const { trtcService, callBillingService } = require('../../../src/services');

const mockReq = (overrides = {}) => ({ userId: 100001, body: {}, query: {}, params: {}, ...overrides });
const mockRes = () => {
  const res = {};
  res.setHeader = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Controller - TRTC', () => {
  beforeEach(() => jest.clearAllMocks());

  // 审计 C-4：不带 roomId 只回「通道已开通」，不发票据（否则任何登录用户都能拿到通吃所有房间的 UserSig）
  it('getAuth without roomId returns availability only, no userSig', async () => {
    trtcService.generateUserSig.mockReturnValue({ userSig: 'sig', appId: 1400000001, userId: '100001' });
    const res = mockRes();
    await trtcController.getAuth(mockReq(), res);
    expect(trtcService.generateUserSig).toHaveBeenCalledWith(100001);
    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.data.configured).toBe(true);
    expect(payload.data.userSig).toBeNull();
    expect(payload.data.requiresRoomId).toBe(true);
    expect(trtcService.requireEnterableRoom).not.toHaveBeenCalled();
  });

  it('getAuth with roomId verifies room membership before issuing the ticket', async () => {
    trtcService.generateUserSig.mockReturnValue({ userSig: 'sig', appId: 1400000001, userId: '100001' });
    trtcService.requireEnterableRoom.mockResolvedValue({ id: 7, status: 1 });
    const res = mockRes();
    await trtcController.getAuth(mockReq({ query: { roomId: '555' } }), res);
    expect(trtcService.requireEnterableRoom).toHaveBeenCalledWith(100001, '555');
    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.data.userSig).toBe('sig');
    expect(payload.data.roomId).toBe('555');
  });

  it('getAuth maps non-member to 403, missing room to 404, ended call to 422', async () => {
    trtcService.generateUserSig.mockReturnValue({ userSig: 'sig', appId: 1, userId: '100001' });

    trtcService.requireEnterableRoom.mockRejectedValue(new Error('无权进入该房间'));
    const forbidden = mockRes();
    await trtcController.getAuth(mockReq({ query: { roomId: '555' } }), forbidden);
    expect(forbidden.status).toHaveBeenCalledWith(403);

    trtcService.requireEnterableRoom.mockRejectedValue(new Error('房间不存在或已过期'));
    const missing = mockRes();
    await trtcController.getAuth(mockReq({ query: { roomId: '555' } }), missing);
    expect(missing.status).toHaveBeenCalledWith(404);

    trtcService.requireEnterableRoom.mockRejectedValue(new Error('通话已结束，无法进入该房间'));
    const ended = mockRes();
    await trtcController.getAuth(mockReq({ query: { roomId: '555' } }), ended);
    expect(ended.status).toHaveBeenCalledWith(422);
  });

  // 未配置是「通道未开通」而非「服务故障」：返回 200 + configured:false，
  // 避免被 5xx 监控规则误判（前端仍按 appId 缺失自动降级 WebRTC）。
  it('getAuth returns configured:false (200) when service not configured', async () => {
    trtcService.generateUserSig.mockReturnValue(null);
    const res = mockRes();
    await trtcController.getAuth(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.data.configured).toBe(false);
    expect(payload.data.appId).toBeNull();
    expect(payload.data.userSig).toBeNull();
  });

  it('getAuth returns configured:false (200) when service reports 未配置', async () => {
    trtcService.generateUserSig.mockImplementation(() => { throw new Error('TRTC未配置'); });
    const res = mockRes();
    await trtcController.getAuth(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data.configured).toBe(false);
  });

  // 意外故障（不是成员校验的四类业务原因）必须保持 500，不能伪装成 4xx
  it('getAuth errors when service throws', async () => {
    trtcService.generateUserSig.mockImplementation(() => { throw new Error('bad'); });
    const res = mockRes();
    await trtcController.getAuth(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('startCall rejects missing calleeId', async () => {
    const res = mockRes();
    await trtcController.startCall(mockReq({ body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('startCall succeeds with defaults', async () => {
    callBillingService.startCall.mockResolvedValue({ callId: 1 });
    const res = mockRes();
    await trtcController.startCall(mockReq({ body: { calleeId: '2' } }), res);
    expect(callBillingService.startCall).toHaveBeenCalledWith(100001, 2, 1, false, 0);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('startCall passes options and maps error to 422', async () => {
    callBillingService.startCall.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await trtcController.startCall(mockReq({ body: { calleeId: 2, callType: '2', isCompanionCall: true, orderId: '9' } }), res);
    expect(callBillingService.startCall).toHaveBeenCalledWith(100001, 2, 2, true, 9);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  const callOps = [
    ['cancelCall', 'cancelCall', '已取消通话'],
    ['rejectCall', 'rejectCall', '已拒绝通话'],
    ['acceptCall', 'acceptCall', '已接听']
  ];
  callOps.forEach(([fn, serviceFn]) => {
    it(fn + ' rejects missing callId', async () => {
      const res = mockRes();
      await trtcController[fn](mockReq({ body: {} }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it(fn + ' succeeds', async () => {
      callBillingService[serviceFn].mockResolvedValue(true);
      const res = mockRes();
      await trtcController[fn](mockReq({ body: { callId: '7' } }), res);
      expect(callBillingService[serviceFn]).toHaveBeenCalledWith(100001, 7);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it(fn + ' maps error to 422', async () => {
      callBillingService[serviceFn].mockRejectedValue(new Error('bad'));
      const res = mockRes();
      await trtcController[fn](mockReq({ body: { callId: 7 } }), res);
      expect(res.status).toHaveBeenCalledWith(422);
    });
  });

  it('endCall rejects missing callId and succeeds', async () => {
    const bad = mockRes();
    await trtcController.endCall(mockReq({ body: {} }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);

    callBillingService.endCall.mockResolvedValue({ duration: 10 });
    const ok = mockRes();
    await trtcController.endCall(mockReq({ body: { callId: '7' } }), ok);
    expect(callBillingService.endCall).toHaveBeenCalledWith(100001, 7);
    expect(ok.status).toHaveBeenCalledWith(200);

    callBillingService.endCall.mockRejectedValue(new Error('bad'));
    const err = mockRes();
    await trtcController.endCall(mockReq({ body: { callId: 7 } }), err);
    expect(err.status).toHaveBeenCalledWith(422);
  });

  it('getCallHistory uses pagination', async () => {
    callBillingService.getCallHistory.mockResolvedValue({ list: [], total: 0 });
    const res = mockRes();
    await trtcController.getCallHistory(mockReq({ query: { page: '2', pageSize: '5' } }), res);
    expect(callBillingService.getCallHistory).toHaveBeenCalledWith(100001, 2, 5);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getCallHistory maps error to 500', async () => {
    callBillingService.getCallHistory.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await trtcController.getCallHistory(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('createRoom defaults roomType and succeeds', async () => {
    trtcService.createRoom.mockResolvedValue({ roomId: 1 });
    const res = mockRes();
    await trtcController.createRoom(mockReq({ body: {} }), res);
    expect(trtcService.createRoom).toHaveBeenCalledWith(100001, 'video');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('createRoom maps error to 500', async () => {
    trtcService.createRoom.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await trtcController.createRoom(mockReq({ body: { roomType: 'audio' } }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('enterRoom rejects missing roomId and succeeds', async () => {
    const bad = mockRes();
    await trtcController.enterRoom(mockReq({ body: {} }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);

    trtcService.enterRoom.mockResolvedValue({ ok: true });
    const ok = mockRes();
    await trtcController.enterRoom(mockReq({ body: { roomId: '555' } }), ok);
    expect(trtcService.enterRoom).toHaveBeenCalledWith(100001, '555');
    expect(ok.status).toHaveBeenCalledWith(200);
  });

  // 审计 C-4：房间口子按成员校验的业务原因分流，意外故障仍是 500
  it('enterRoom/leaveRoom/startBilling map room-access reasons to 403/404/422', async () => {
    const cases = [
      ['无权进入该房间', 403],
      ['房间不存在或已过期', 404],
      ['通话已结束，无法进入该房间', 422],
      ['房间号格式不正确', 422],
      ['数据库连接失败', 500]
    ];

    for (const [method, args] of [
      ['enterRoom', { body: { roomId: '555' } }],
      ['leaveRoom', { body: { roomId: '555' } }],
      ['startBilling', { body: { roomId: '555' } }]
    ]) {
      for (const [message, status] of cases) {
        trtcService[method].mockRejectedValue(new Error(message));
        const res = mockRes();
        await trtcController[method](mockReq(args), res);
        expect(res.status).toHaveBeenCalledWith(status);
      }
    }
  });

  it('leaveRoom rejects missing roomId and succeeds', async () => {
    const bad = mockRes();
    await trtcController.leaveRoom(mockReq({ body: {} }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);

    trtcService.leaveRoom.mockResolvedValue({ ok: true });
    const ok = mockRes();
    await trtcController.leaveRoom(mockReq({ body: { roomId: 'r1' } }), ok);
    expect(ok.status).toHaveBeenCalledWith(200);
  });

  it('getRoomInfo rejects missing roomId, succeeds and maps error', async () => {
    const bad = mockRes();
    await trtcController.getRoomInfo(mockReq({ params: {} }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);

    // 审计 C-4：必须带上当前用户，由服务层核对成员关系后才返回真实房间状态
    trtcService.getRoomInfo.mockResolvedValue({ roomId: '555' });
    const ok = mockRes();
    await trtcController.getRoomInfo(mockReq({ params: { roomId: '555' } }), ok);
    expect(trtcService.getRoomInfo).toHaveBeenCalledWith(100001, '555');
    expect(ok.status).toHaveBeenCalledWith(200);

    trtcService.getRoomInfo.mockRejectedValue(new Error('无权进入该房间'));
    const forbidden = mockRes();
    await trtcController.getRoomInfo(mockReq({ params: { roomId: '555' } }), forbidden);
    expect(forbidden.status).toHaveBeenCalledWith(403);

    trtcService.getRoomInfo.mockRejectedValue(new Error('bad'));
    const err = mockRes();
    await trtcController.getRoomInfo(mockReq({ params: { roomId: 'r1' } }), err);
    expect(err.status).toHaveBeenCalledWith(500);
  });

  it('startBilling rejects missing roomId and succeeds', async () => {
    const bad = mockRes();
    await trtcController.startBilling(mockReq({ body: {} }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);

    trtcService.startBilling.mockResolvedValue({ billingId: 1 });
    const ok = mockRes();
    await trtcController.startBilling(mockReq({ body: { roomId: 'r1', callType: 2 } }), ok);
    expect(trtcService.startBilling).toHaveBeenCalledWith(100001, 'r1', 2);
    expect(ok.status).toHaveBeenCalledWith(200);
  });

  it('endBilling rejects missing billingId and succeeds', async () => {
    const bad = mockRes();
    await trtcController.endBilling(mockReq({ body: {} }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);

    trtcService.endBilling.mockResolvedValue({ amount: 5 });
    const ok = mockRes();
    await trtcController.endBilling(mockReq({ body: { billingId: '3' } }), ok);
    expect(trtcService.endBilling).toHaveBeenCalledWith('3');
    expect(ok.status).toHaveBeenCalledWith(200);
  });
});
