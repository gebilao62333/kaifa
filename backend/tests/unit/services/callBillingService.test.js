jest.mock('../../../src/models', () => ({
  CallRecord: { findByPk: jest.fn() },
  CallBilling: { create: jest.fn() },
  User: { findByPk: jest.fn(), update: jest.fn(), increment: jest.fn() }
}));
jest.mock('../../../src/config/mysql', () => ({ transaction: jest.fn() }));

const { CallRecord } = require('../../../src/models');
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
