jest.mock('../../../src/models', () => ({
  CallRecord: { findByPk: jest.fn(), findOne: jest.fn(), create: jest.fn() },
  CallBilling: { create: jest.fn() },
  User: { findByPk: jest.fn(), update: jest.fn(), increment: jest.fn() }
}));
jest.mock('../../../src/config/mysql', () => ({ transaction: jest.fn() }));

const { CallRecord, User } = require('../../../src/models');
const callBillingService = require('../../../src/services/callBillingService');

const makeCall = (over = {}) => Object.assign({
  id: 1,
  caller_id: 1,
  callee_id: 2,
  status: 1,
  connect_time: 0,
  is_companion_call: 0,
  update: jest.fn().mockResolvedValue(true)
}, over);

describe('Service - callBillingService.endCall', () => {
  beforeEach(() => {
    CallRecord.findByPk.mockReset();
  });

  it('通话不存在时抛错', async () => {
    CallRecord.findByPk.mockResolvedValue(null);
    await expect(callBillingService.endCall(1, 9)).rejects.toThrow('通话不存在');
  });

  it('非通话双方无权结束', async () => {
    CallRecord.findByPk.mockResolvedValue(makeCall());
    await expect(callBillingService.endCall(99, 1)).rejects.toThrow('无权操作此通话');
  });

  it('呼叫中就挂断 → 标记「无应答」(status=5)，不计费', async () => {
    const call = makeCall({ status: 0 });
    CallRecord.findByPk.mockResolvedValue(call);
    const r = await callBillingService.endCall(1, 1);
    expect(r).toEqual({ duration: 0 });
    expect(call.update).toHaveBeenCalledWith(expect.objectContaining({ status: 5, end_reason: 'unanswered_hangup' }));
  });

  it('已接通后结束 → status=4 且算出通话时长', async () => {
    const now = Math.floor(Date.now() / 1000);
    const call = makeCall({ status: 1, connect_time: now - 10 });
    CallRecord.findByPk.mockResolvedValue(call);
    const r = await callBillingService.endCall(1, 1);
    expect(call.update).toHaveBeenCalledWith(expect.objectContaining({ status: 4, end_reason: 'normal' }));
    expect(r.duration).toBeGreaterThanOrEqual(9);
  });

  it('已结束的单不能重复结束', async () => {
    CallRecord.findByPk.mockResolvedValue(makeCall({ status: 4 }));
    await expect(callBillingService.endCall(1, 1)).rejects.toThrow('通话状态不正确');
  });
});

// 审计 C-4 附带项：TRTC 房间号必须避开「仍在进行」的通话，否则两通电话会串房。
describe('Service - callBillingService.startCall 房间号分配', () => {
  const { Op } = require('sequelize');

  beforeEach(() => {
    CallRecord.findOne.mockReset();
    CallRecord.create.mockReset();
    User.findByPk.mockReset();
    User.findByPk.mockResolvedValue({ id: 1 });
    CallRecord.create.mockImplementation((data) =>
      Promise.resolve({ id: 5, call_no: data.call_no, trtc_room_id: data.trtc_room_id })
    );
  });

  it('查重只针对呼叫中/已接通的通话', async () => {
    CallRecord.findOne.mockResolvedValue(null);
    const r = await callBillingService.startCall(1, 2, 1);

    const where = CallRecord.findOne.mock.calls[0][0].where;
    expect(where.status[Op.in]).toEqual([0, 1]);
    expect(r.trtcRoomId).toBeGreaterThan(0);
    expect(r.trtcRoomId).toBeLessThan(1000000);
  });

  it('房间号与进行中的通话撞号时换新号重试', async () => {
    let queries = 0;
    CallRecord.findOne.mockImplementation(() => {
      queries += 1;
      return Promise.resolve(queries === 1 ? { id: 9 } : null);
    });

    const r = await callBillingService.startCall(1, 2, 1);
    expect(CallRecord.findOne).toHaveBeenCalledTimes(2);
    // 两次查重的候选号不同（密码学随机，不再用 Math.random 且不带时间前缀）
    const tried = CallRecord.findOne.mock.calls.map((args) => args[0].where.trtc_room_id);
    expect(new Set(tried).size).toBe(2);
    expect(r.trtcRoomId).toBe(tried[1]);
  });

  it('连续撞号则明确失败，不建单', async () => {
    CallRecord.findOne.mockResolvedValue({ id: 9 });
    await expect(callBillingService.startCall(1, 2, 1)).rejects.toThrow('通话房间号分配失败');
    expect(CallRecord.findOne).toHaveBeenCalledTimes(5);
    expect(CallRecord.create).not.toHaveBeenCalled();
  });

  it('用户不存在时不分配房间号', async () => {
    User.findByPk.mockResolvedValue(null);
    await expect(callBillingService.startCall(1, 2, 1)).rejects.toThrow('用户不存在');
    expect(CallRecord.findOne).not.toHaveBeenCalled();
  });
});
