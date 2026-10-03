const walletController = require('../../../src/controllers/walletController');

jest.mock('../../../src/services', () => ({
  walletService: {
    getWalletOverview: jest.fn(),
    getIncomeRecords: jest.fn(),
    getIncomeBreakdown: jest.fn(),
    getWithdrawRecords: jest.fn(),
    applyWithdraw: jest.fn(),
    getExpenseRecords: jest.fn(),
    getExpenseOverview: jest.fn()
  }
}));

const { walletService } = require('../../../src/services');

const mockReq = (overrides = {}) => ({ userId: 100001, body: {}, query: {}, params: {}, ...overrides });
const mockRes = () => {
  const res = {};
  res.setHeader = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Controller - Wallet', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getOverview returns data', async () => {
    walletService.getWalletOverview.mockResolvedValue({ total: 100 });
    const res = mockRes();
    await walletController.getOverview(mockReq(), res);
    expect(walletService.getWalletOverview).toHaveBeenCalledWith(100001);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getOverview maps error to 500', async () => {
    walletService.getWalletOverview.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await walletController.getOverview(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('getIncomeRecords defaults pagination', async () => {
    walletService.getIncomeRecords.mockResolvedValue({ list: [], total: 0 });
    const res = mockRes();
    await walletController.getIncomeRecords(mockReq({ query: {} }), res);
    expect(walletService.getIncomeRecords).toHaveBeenCalledWith(100001, { page: 1, pageSize: 50 });
  });

  it('getIncomeRecords parses pagination', async () => {
    walletService.getIncomeRecords.mockResolvedValue({ list: [], total: 0 });
    const res = mockRes();
    await walletController.getIncomeRecords(mockReq({ query: { page: '2', pageSize: '10' } }), res);
    expect(walletService.getIncomeRecords).toHaveBeenCalledWith(100001, { page: 2, pageSize: 10 });
  });

  it('getIncomeBreakdown returns data', async () => {
    walletService.getIncomeBreakdown.mockResolvedValue([]);
    const res = mockRes();
    await walletController.getIncomeBreakdown(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getWithdrawRecords returns data', async () => {
    walletService.getWithdrawRecords.mockResolvedValue([]);
    const res = mockRes();
    await walletController.getWithdrawRecords(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('applyWithdraw rejects non-positive amount', async () => {
    const res = mockRes();
    await walletController.applyWithdraw(mockReq({ body: { amount: 0 } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('applyWithdraw normalizes types and succeeds', async () => {
    walletService.applyWithdraw.mockResolvedValue({ id: 1 });
    const res = mockRes();
    await walletController.applyWithdraw(mockReq({
      body: { amount: '12.5', type: 2, account: 'a', name: 5, image: null, bank: { x: 1 } }
    }), res);

    expect(walletService.applyWithdraw).toHaveBeenCalledWith(100001, {
      amount: 12.5, type: 2, account: 'a', name: '', image: '', bank: ''
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('applyWithdraw maps error to 422', async () => {
    walletService.applyWithdraw.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await walletController.applyWithdraw(mockReq({ body: { amount: 10 } }), res);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('getExpenseRecords defaults pagination', async () => {
    walletService.getExpenseRecords.mockResolvedValue({ list: [], total: 0 });
    const res = mockRes();
    await walletController.getExpenseRecords(mockReq({ query: {} }), res);
    expect(walletService.getExpenseRecords).toHaveBeenCalledWith(100001, { page: 1, pageSize: 50 });
  });

  it('getExpenseOverview returns data', async () => {
    walletService.getExpenseOverview.mockResolvedValue({ total: 5 });
    const res = mockRes();
    await walletController.getExpenseOverview(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getExpenseOverview maps error to 500', async () => {
    walletService.getExpenseOverview.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await walletController.getExpenseOverview(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
