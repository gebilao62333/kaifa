jest.mock('../../../src/models', () => ({
  Withdraw: { findAndCountAll: jest.fn(), create: jest.fn(), findByPk: jest.fn(), update: jest.fn() },
  User: { findByPk: jest.fn() }
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
    User.findByPk.mockResolvedValue({ id: 2 });
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

  it('getWalletOverview computes assets, withdraw and expenses', async () => {
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
    const result = await walletService.getWalletOverview(2);
    expect(result.grossIncome).toBe(100);
    expect(result.totalWithdraw).toBe(20);
    expect(result.totalAssets).toBe(80);
    expect(result.currencyUnit).toBe('金币');
    expect(result.todayExpense).toBeGreaterThanOrEqual(0);
  });

  it('getWalletOverview never returns negative assets', async () => {
    setSeq([[], [], [], [], [], [], [], []]);
    Withdraw.findAndCountAll.mockResolvedValue({ rows: [{ amount: 99, status: 1 }] });
    const result = await walletService.getWalletOverview(2);
    expect(result.totalAssets).toBe(0);
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

    it('rejects when the balance is insufficient', async () => {
      setSeq([[], [], [], [], [], [], [], []]);
      await expect(walletService.applyWithdraw(2, { amount: 200 })).rejects.toThrow('可提现余额不足');
    });

    it('creates a withdraw request with fee', async () => {
      setSeq([
        [{ id: 1, amount: 500, create_time: nowSec }], [], [], [], [],
        [], [], []
      ]);
      const result = await walletService.applyWithdraw(2, { amount: 200, type: '2', account: 'a', name: 'n', bank: 'b' });
      expect(result.success).toBe(true);
      expect(result.fee).toBe(10);
      expect(result.netAmount).toBe(190);
      expect(Withdraw.create).toHaveBeenCalled();
    });
  });
});
