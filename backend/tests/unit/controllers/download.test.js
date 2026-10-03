const downloadController = require('../../../src/controllers/download');

const mockReq = (overrides = {}) => ({ body: {}, query: {}, params: {}, ...overrides });
const mockRes = () => {
  const res = {};
  res.setHeader = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
};

const body = (res) => res.json.mock.calls[0][0];

// 先创建一个可用的下载项，返回其 id，避免依赖模块内初始数据的固定 id
const createItem = async (overrides = {}) => {
  const res = mockRes();
  await downloadController.createDownload(mockReq({
    body: { platform: 'android', version: 'v-test', url: 'https://cdn.example.com/a&#x2F;b.apk', size: '1MB', ...overrides }
  }), res);
  return body(res).data.id;
};

describe('Controller - Download (admin)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getDownloadList returns paginated list', async () => {
    const res = mockRes();
    await downloadController.getDownloadList(mockReq({ query: {} }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    const data = body(res).data;
    expect(Array.isArray(data.list)).toBe(true);
    expect(data.total).toBeGreaterThanOrEqual(3);
    expect(data.page).toBe(1);
  });

  it('getDownloadList filters by platform/status/keyword', async () => {
    await createItem({ version: 'keyword-xyz' });

    const res1 = mockRes();
    await downloadController.getDownloadList(mockReq({ query: { platform: 'ios' } }), res1);
    expect(body(res1).data.list.every(d => d.platform === 'ios')).toBe(true);

    const res2 = mockRes();
    await downloadController.getDownloadList(mockReq({ query: { keyword: 'keyword-xyz' } }), res2);
    expect(body(res2).data.list.length).toBeGreaterThanOrEqual(1);

    const res3 = mockRes();
    await downloadController.getDownloadList(mockReq({ query: { status: '1' } }), res3);
    expect(body(res3).data.list.every(d => d.status === 1)).toBe(true);
  });

  it('getDownloadList paginates and decodes entities', async () => {
    await createItem({ version: 'paged' });
    const res = mockRes();
    await downloadController.getDownloadList(mockReq({ query: { page: '1', pageSize: '1' } }), res);
    expect(body(res).data.list.length).toBe(1);
  });

  it('getDownloadDetail returns existing item and decodes url', async () => {
    const id = await createItem({ url: 'https://x.com/p&#x2F;q.apk' });
    const res = mockRes();
    await downloadController.getDownloadDetail(mockReq({ params: { id: String(id) } }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(body(res).data.url).toBe('https://x.com/p/q.apk');
  });

  it('getDownloadDetail returns 404 when missing', async () => {
    const res = mockRes();
    await downloadController.getDownloadDetail(mockReq({ params: { id: '99999999' } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('createDownload validates platform and url', async () => {
    const badPlatform = mockRes();
    await downloadController.createDownload(mockReq({ body: { platform: 'windows', url: 'u' } }), badPlatform);
    expect(badPlatform.status).toHaveBeenCalledWith(400);

    const badUrl = mockRes();
    await downloadController.createDownload(mockReq({ body: { platform: 'ios' } }), badUrl);
    expect(badUrl.status).toHaveBeenCalledWith(400);
  });

  it('createDownload creates and returns 201', async () => {
    const res = mockRes();
    await downloadController.createDownload(mockReq({ body: { platform: 'harmony', version: '2.0.0', url: 'https://h.com/a&#x2F;b', sort: '5', status: '1' } }), res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(body(res).data.url).toBe('https://h.com/a/b');
    expect(body(res).data.sort).toBe(5);
  });

  it('updateDownload handles 404, invalid platform and success', async () => {
    const missing = mockRes();
    await downloadController.updateDownload(mockReq({ params: { id: '99999999' }, body: {} }), missing);
    expect(missing.status).toHaveBeenCalledWith(404);

    const id = await createItem();
    const bad = mockRes();
    await downloadController.updateDownload(mockReq({ params: { id: String(id) }, body: { platform: 'nope' } }), bad);
    expect(bad.status).toHaveBeenCalledWith(400);

    const ok = mockRes();
    await downloadController.updateDownload(mockReq({
      params: { id: String(id) },
      body: { platform: 'ios', version: '3.0.0', url: 'https://new', size: '2MB', sort: '1', status: '0' }
    }), ok);
    expect(ok.status).toHaveBeenCalledWith(200);
    expect(body(ok).data.version).toBe('3.0.0');
    expect(body(ok).data.status).toBe(0);
  });

  it('updateDownloadStatus handles 404, missing status and success', async () => {
    const missing = mockRes();
    await downloadController.updateDownloadStatus(mockReq({ params: { id: '99999999' }, body: { status: 0 } }), missing);
    expect(missing.status).toHaveBeenCalledWith(404);

    const id = await createItem();
    const noStatus = mockRes();
    await downloadController.updateDownloadStatus(mockReq({ params: { id: String(id) }, body: {} }), noStatus);
    expect(noStatus.status).toHaveBeenCalledWith(400);

    const ok = mockRes();
    await downloadController.updateDownloadStatus(mockReq({ params: { id: String(id) }, body: { status: '0' } }), ok);
    expect(ok.status).toHaveBeenCalledWith(200);
    expect(body(ok).data.status).toBe(0);
  });

  it('deleteDownload handles 404 and success', async () => {
    const missing = mockRes();
    await downloadController.deleteDownload(mockReq({ params: { id: '99999999' } }), missing);
    expect(missing.status).toHaveBeenCalledWith(404);

    const id = await createItem();
    const ok = mockRes();
    await downloadController.deleteDownload(mockReq({ params: { id: String(id) } }), ok);
    expect(ok.status).toHaveBeenCalledWith(200);
  });
});

describe('Controller - Download (public)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getPublicPlatforms returns enabled items', async () => {
    const res = mockRes();
    await downloadController.getPublicPlatforms(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(Array.isArray(body(res).data)).toBe(true);
  });

  it('redirectDownload returns 404 when no url available', async () => {
    const res = mockRes();
    await downloadController.redirectDownload(mockReq({ params: { platform: 'nope' } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('redirectDownload redirects to the stored url', async () => {
    const createRes = mockRes();
    await downloadController.createDownload(mockReq({
      body: { platform: 'ios', url: 'https://dl.example.com/app&#x2F;ios.ipa', status: 1 }
    }), createRes);
    const res = mockRes();
    await downloadController.redirectDownload(mockReq({ params: { platform: 'ios' } }), res);
    expect(res.redirect).toHaveBeenCalledWith('https://dl.example.com/app/ios.ipa');
  });
});
