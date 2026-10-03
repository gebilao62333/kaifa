jest.mock('../../../src/models', () => ({ CallRecord: { update: jest.fn() } }));

const { CallRecord } = require('../../../src/models');
const cleanup = require('../../../src/services/callRecordCleanup');

describe('Service - 未接通通话单清理', () => {
  beforeEach(() => {
    CallRecord.update.mockReset();
  });

  it('把超时未接通的通话单标记为「无应答」(status=5)', async () => {
    CallRecord.update.mockResolvedValue([3]);
    const n = await cleanup.runCallRecordCleanupOnce();
    expect(n).toBe(3);
    const [values, options] = CallRecord.update.mock.calls[0];
    expect(values.status).toBe(5);
    expect(values.end_reason).toBe('unanswered_timeout');
    expect(typeof values.end_time).toBe('number');
    expect(options.where.status).toBe(0);
    expect(options.where.create_time).toBeDefined();
  });

  it('没有需要清理的单时返回 0', async () => {
    CallRecord.update.mockResolvedValue([0]);
    await expect(cleanup.runCallRecordCleanupOnce()).resolves.toBe(0);
  });

  it('数据库异常只记日志，不向调用方抛出（不拖垮主服务）', async () => {
    CallRecord.update.mockRejectedValue(new Error('db down'));
    await expect(cleanup.runCallRecordCleanupOnce()).resolves.toBe(0);
  });

  it('响铃超时阈值为 120 秒', () => {
    expect(cleanup.RING_TIMEOUT).toBe(120);
  });
});
