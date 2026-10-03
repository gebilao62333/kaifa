const reportController = require('../../../src/controllers/report');

jest.mock('../../../src/services', () => ({
  reportService: {
    createReport: jest.fn(),
    getReportList: jest.fn(),
    getReportDetail: jest.fn(),
    handleReport: jest.fn()
  }
}));

const { reportService } = require('../../../src/services');

const mockReq = (overrides = {}) => ({ userId: 100001, body: {}, query: {}, params: {}, ...overrides });
const mockRes = () => {
  const res = {};
  res.setHeader = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Controller - Report', () => {
  beforeEach(() => jest.clearAllMocks());

  it('createReport rejects missing fields', async () => {
    const res = mockRes();
    await reportController.createReport(mockReq({ body: { targetType: 1 } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('createReport creates successfully with default images', async () => {
    reportService.createReport.mockResolvedValue({ id: 1 });
    const res = mockRes();

    await reportController.createReport(mockReq({ body: { targetType: '1', targetId: '2', reason: 'spam' } }), res);

    expect(reportService.createReport).toHaveBeenCalledWith(100001, 1, 2, 'spam', []);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('createReport maps error to 422', async () => {
    reportService.createReport.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await reportController.createReport(mockReq({ body: { targetType: 1, targetId: 2, reason: 'r', images: ['a'] } }), res);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('getReportList without status', async () => {
    reportService.getReportList.mockResolvedValue({ list: [], total: 0 });
    const res = mockRes();
    await reportController.getReportList(mockReq({ query: { page: '1', pageSize: '20' } }), res);
    expect(reportService.getReportList).toHaveBeenCalledWith(100001, undefined, 1, 20);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getReportList with status', async () => {
    reportService.getReportList.mockResolvedValue({ list: [], total: 0 });
    const res = mockRes();
    await reportController.getReportList(mockReq({ query: { status: '1' } }), res);
    expect(reportService.getReportList).toHaveBeenCalledWith(100001, 1, 1, 20);
  });

  it('getReportList returns 500 on error', async () => {
    reportService.getReportList.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await reportController.getReportList(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('getReportDetail rejects missing id', async () => {
    const res = mockRes();
    await reportController.getReportDetail(mockReq({ query: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('getReportDetail not found maps to 404', async () => {
    reportService.getReportDetail.mockRejectedValue(new Error('举报不存在'));
    const res = mockRes();
    await reportController.getReportDetail(mockReq({ query: { reportId: '1' } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('getReportDetail forbidden maps to 403', async () => {
    reportService.getReportDetail.mockRejectedValue(new Error('无权查看该举报'));
    const res = mockRes();
    await reportController.getReportDetail(mockReq({ query: { reportId: '1' } }), res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('getReportDetail other error maps to 500', async () => {
    reportService.getReportDetail.mockRejectedValue(new Error('other'));
    const res = mockRes();
    await reportController.getReportDetail(mockReq({ query: { reportId: '1' } }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('handleReport rejects missing id', async () => {
    const res = mockRes();
    await reportController.handleReport(mockReq({ body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('handleReport succeeds', async () => {
    reportService.handleReport.mockResolvedValue(true);
    const res = mockRes();
    await reportController.handleReport(mockReq({ body: { reportId: '3', action: 'ban', result: 'ok' } }), res);
    expect(reportService.handleReport).toHaveBeenCalledWith(100001, 3, 'ban', 'ok');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('handleReport maps error to 422', async () => {
    reportService.handleReport.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await reportController.handleReport(mockReq({ body: { reportId: 3 } }), res);
    expect(res.status).toHaveBeenCalledWith(422);
  });
});
