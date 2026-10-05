jest.mock('../../../src/models', () => ({
  Withdraw: { findAndCountAll: jest.fn(), create: jest.fn(), findByPk: jest.fn(), update: jest.fn() },
  User: { findByPk: jest.fn(), decrement: jest.fn(), increment: jest.fn() }
}));
jest.mock('../../../src/config/mysql', () => ({
  query: jest.fn(),
  transaction: jest.fn(() => Promise.resolve({
    commit: jest.fn(),
    rollback: jest.fn(),
    finished: false,
    LOCK: { UPDATE: 'UPDATE' }
  }))
}));

const walletService = require('../../../src/services/walletService');
const { Withdraw, User } = require('../../../src/models');
const sequelize = require('../../../src/config/mysql');

// 按顺序为每次 sequelize.query 调用提供返回行
const setSeq = (seq) => {
  let i = 0;
  sequelize.query.mockImplementation(() => Promise.resolve([seq[i++] || [], {}]));
};
const nowSec = 1700000000;

describe('Service - WalletService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sequelize.query.mockResolvedValue([[], {}]);
    Withdraw.findAndCountAll.mockResolvedValue({ rows: [] });
    Withdraw.create.mockResolvedValue({ id: 1 });
    // 审计 B-03：提现改为事务 + 用户行锁串行化
    sequelize.transaction.mockResolvedValue({
      commit: jest.fn(), rollback: jest.fn(), finished: false, LOCK: { UPDATE: 'UPDATE' }
    });
    User.findByPk.mockResolvedValue({ id: 2, money: '1000', gift_money: '0' });
    // 条件扣减默认成功（MySQL 下 decrement 返回 [[null, 受影响行数]]）
    User.decrement.mockResolvedValue([[null, 1]]);
  });

  describe('getIncomeRecords', () => {
    const incomeSeq = () => ([
      [{ id: 1, amount: 10, create_time: nowSec }, { id: 2, amount: 0 }],
      [{ id: 3, amount: 5, create_time: nowSec + 1 }],
      [{ id: 4, amount: 2, create_time: nowSec + 2 }],
      [{ id: 5, amount: 3, call_type: 2, create_time: nowSec + 3 }, { id: 6, amount: 4, call_type: 1, create_time: nowSec + 4 }, { id: 7, amount: 0, call_type: 1 }],
      [{ id: 8, amount: 1, create_time: nowSec + 5 }]
    ]);

    it('aggregates every income source', async () => {
      setSeq(incomeSeq());
      const result = await walletService.getIncomeRecords(2, { page: 1, pageSize: 50 });
      expect(result.total).toBe(6);
      expect(result.list.length).toBe(6);
      const types = result.list.map(r => r.title);
      expect(types).toContain('接单');
      expect(types).toContain('视频聊天');
      expect(types).toContain('语音聊天');
    });

    it('paginates the income list', async () => {
      setSeq(incomeSeq());
      const paged = await walletService.getIncomeRecords(2, { page: 2, pageSize: 2 });
      expect(paged.list.length).toBe(2);
      expect(paged.page).toBe(2);
    });
  });

  it('getIncomeBreakdown aggregates by source', async () => {
    setSeq([
      [{ id: 1, amount: 10, create_time: nowSec }],
      [{ id: 3, amount: 5, create_time: nowSec }],
      [], [], []
    ]);
    const result = await walletService.getIncomeBreakdown(2);
    expect(result.total).toBe(15);
    expect(result.list.find(x => x.sourceType === 'order').amount).toBe(10);
    expect(result.list.find(x => x.sourceType === 'gift').amount).toBe(5);
    expect(result.list.find(x => x.sourceType === 'order').percent).toBeCloseTo(66.7, 1);
  });

  it('getWalletOverview takes totalAssets from the real money balance (audit C-2)', async () => {
    setSeq([
      [{ id: 1, amount: 100, create_time: nowSec }], [], [], [], [],
      [{ id: 1, amount: 30, create_time: nowSec }], [], []
    ]);
    Withdraw.findAndCountAll.mockResolvedValue({
      rows: [
        { amount: 20, status: 1 },
        { amount: 5, status: 2 }
      ]
    });
    // money 是 DECIMAL 列，驱动回传字符串
    User.findByPk.mockResolvedValue({ id: 2, money: '46.5', gift_money: '10' });
    const result = await walletService.getWalletOverview(2);
    expect(result.grossIncome).toBe(100);
    expect(result.totalWithdraw).toBe(20);
    // 总资产 = 真实余额，不再等于「累计收入 - 已提现」（那个口径不含消费与充值）
    expect(result.totalAssets).toBe(46.5);
    expect(result.balance).toBe(46.5);
    expect(result.giftMoney).toBe(10);
    expect(result.currencyUnit).toBe('金币');
    expect(result.todayExpense).toBeGreaterThanOrEqual(0);
  });

  it('getWalletOverview never returns negative assets', async () => {
    setSeq([[], [], [], [], [], [], [], []]);
    Withdraw.findAndCountAll.mockResolvedValue({ rows: [{ amount: 99, status: 1 }] });
    User.findByPk.mockResolvedValue({ id: 2, money: '-3', gift_money: null });
    const result = await walletService.getWalletOverview(2);
    expect(result.totalAssets).toBe(0);
    expect(result.giftMoney).toBe(0);
  });

  it('getWalletOverview rejects a missing user', async () => {
    User.findByPk.mockResolvedValue(null);
    await expect(walletService.getWalletOverview(2)).rejects.toThrow('用户不存在');
  });

  it('getExpenseRecords aggregates expenses', async () => {
    setSeq([
      [{ id: 1, amount: 10, create_time: nowSec }],
      [{ id: 2, amount: 5, create_time: nowSec }],
      [{ id: 3, amount: 0 }]
    ]);
    const result = await walletService.getExpenseRecords(2, { page: 1, pageSize: 50 });
    expect(result.total).toBe(2);
    expect(result.totalExpense).toBe(15);
    expect(result.list[0].sourceType).toBeDefined();
  });

  it('getExpenseOverview aggregates expenses', async () => {
    setSeq([[{ id: 1, amount: 8, create_time: nowSec }], [], []]);
    const result = await walletService.getExpenseOverview(2);
    expect(result.totalExpense).toBe(8);
    expect(result.currencyUnit).toBe('金币');
  });

  describe('getWithdrawRecords', () => {
    it('normalizes mock, plain and Date rows', async () => {
      Withdraw.findAndCountAll.mockResolvedValue({
        rows: [
          { get: () => ({ id: 1, user_id: 2, amount: 10, type: 1, account: 'a', status: 'approved', create_time: new Date(nowSec * 1000), channel: 'wallet' }) },
          { id: 2, user_id: 2, money: 5, is_check: 0, create_time: nowSec, bank: 'b' },
          { id: 3, user_id: 2, amount: 3, is_check: 1, create_time: nowSec },
          { id: 4, user_id: 2, amount: 2, is_check: 2, create_time: nowSec },
          { id: 5, user_id: 2, amount: 1, state: 'rejected', create_time: 2000000000000 }
        ]
      });
      const list = await walletService.getWithdrawRecords(2);
      expect(list.length).toBe(5);
      const walletRow = list.find(r => r.id === 1);
      expect(walletRow.channel).toBe('wallet');
      expect(walletRow.amount).toBe(10);
      const bankRow = list.find(r => r.id === 2);
      expect(bankRow.account).toBe('b');
      expect(bankRow.status).toBe('pending');
      expect(list.find(r => r.id === 3).status).toBe('approved');
      expect(list.find(r => r.id === 4).status).toBe('rejected');
      expect(list.find(r => r.id === 5).status).toBe('rejected');
    });
  });

  describe('applyWithdraw', () => {
    it('validates the amount', async () => {
      await expect(walletService.applyWithdraw(2, { amount: 0 })).rejects.toThrow('提现金额必须大于0');
      await expect(walletService.applyWithdraw(2, { amount: -1 })).rejects.toThrow('提现金额必须大于0');
      await expect(walletService.applyWithdraw(2, { amount: 50 })).rejects.toThrow('最低提现金额为 100 金币');
    });

    it('rejects a non-numeric amount before opening a transaction', async () => {
      await expect(walletService.applyWithdraw(2, { amount: 'abc' })).rejects.toThrow('提现金额必须为有限数字');
      await expect(walletService.applyWithdraw(2, { amount: 'Infinity' })).rejects.toThrow('提现金额必须为有限数字');
      expect(sequelize.transaction).not.toHaveBeenCalled();
    });

    it('rejects when the real balance is insufficient (conditional decrement)', async () => {
      User.decrement.mockResolvedValue([[null, 0]]);
      await expect(walletService.applyWithdraw(2, { amount: 200 })).rejects.toThrow('可提现余额不足');
      expect(Withdraw.create).not.toHaveBeenCalled();
    });

    it('rolls back the transaction when the decrement fails', async () => {
      User.decrement.mockResolvedValue([[null, 0]]);
      // beforeEach 用 mockResolvedValue 复用同一个事务对象，可直接断言它的 rollback 被调用
      const tx = await sequelize.transaction();
      await expect(walletService.applyWithdraw(2, { amount: 200 })).rejects.toThrow('可提现余额不足');
      expect(tx.rollback).toHaveBeenCalledTimes(1);
      expect(tx.commit).not.toHaveBeenCalled();
    });

    it('creates a withdraw request with fee', async () => {
      const result = await walletService.applyWithdraw(2, { amount: 200, type: '2', account: 'a', name: 'n', bank: 'b' });
      expect(result.success).toBe(true);
      expect(result.fee).toBe(10);
      expect(result.netAmount).toBe(190);
      expect(User.decrement).toHaveBeenCalledWith('money', expect.objectContaining({
        by: 200,
        where: { id: 2, money: { [require('sequelize').Op].gte: 200 } }
      }));
      expect(Withdraw.create).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 2, money: 200, amount: 200, channel: 'wallet' }),
        expect.anything()
      );
    });

    // xn_withdraw.image 为 STRING(255)：整段 base64 收款码会让严格模式报 Data too long、
    // 非严格模式静默截断，必须在落库前拦截。
    it('rejects oversized receiving fields before opening a transaction', async () => {
      const dataUrl = 'data:image/png;base64,' + 'A'.repeat(300);
      await expect(walletService.applyWithdraw(2, { amount: 200, image: dataUrl }))
        .rejects.toThrow('收款码请先上传图片，再提交图片链接');
      await expect(walletService.applyWithdraw(2, { amount: 200, name: 'X'.repeat(51) }))
        .rejects.toThrow('收款人姓名过长');
      await expect(walletService.applyWithdraw(2, { amount: 200, account: 'X'.repeat(256) }))
        .rejects.toThrow('收款账号过长');
      expect(Withdraw.create).not.toHaveBeenCalled();
      expect(sequelize.transaction).not.toHaveBeenCalled();
    });

    it('accepts an uploaded image url within the column length', async () => {
      setSeq([
        [{ id: 1, amount: 500, create_time: nowSec }], [], [], [], [],
        [], [], []
      ]);
      const url = 'https://cdn.example.com/withdraw/qrcode_1700000000.png';
      await walletService.applyWithdraw(2, { amount: 200, type: '1', account: 'a', image: url });
      expect(Withdraw.create).toHaveBeenCalledWith(
        expect.objectContaining({ image: url }),
        expect.anything()
      );
    });
  });
});
