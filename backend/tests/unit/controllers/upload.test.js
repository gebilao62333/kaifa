const uploadController = require('../../../src/controllers/upload');

jest.mock('../../../src/services', () => ({
  uploadService: {
    uploadImage: jest.fn(),
    uploadAudio: jest.fn(),
    uploadVideo: jest.fn(),
    getDirectUploadToken: jest.fn()
  },
  mediaAssetService: {
    register: jest.fn()
  }
}));

const { uploadService, mediaAssetService } = require('../../../src/services');

const mockReq = (overrides = {}) => ({ userId: 100001, body: {}, query: {}, params: {}, ...overrides });
const mockRes = () => {
  const res = {};
  res.setHeader = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Controller - Upload', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uploadImage rejects missing file', async () => {
    const res = mockRes();
    await uploadController.uploadImage(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('uploadImage succeeds', async () => {
    uploadService.uploadImage.mockResolvedValue({ url: 'a.jpg' });
    const res = mockRes();
    await uploadController.uploadImage(mockReq({ file: { path: 'p' } }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('uploadImage maps error to 400', async () => {
    uploadService.uploadImage.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await uploadController.uploadImage(mockReq({ file: { path: 'p' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('uploadAudio rejects missing file', async () => {
    const res = mockRes();
    await uploadController.uploadAudio(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('uploadAudio succeeds', async () => {
    uploadService.uploadAudio.mockResolvedValue({ url: 'a.mp3' });
    const res = mockRes();
    await uploadController.uploadAudio(mockReq({ file: { path: 'p' } }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('uploadVideo rejects missing file', async () => {
    const res = mockRes();
    await uploadController.uploadVideo(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('uploadVideo succeeds', async () => {
    uploadService.uploadVideo.mockResolvedValue({ url: 'a.mp4' });
    const res = mockRes();
    await uploadController.uploadVideo(mockReq({ file: { path: 'p' } }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getUploadToken rejects when service returns falsy', async () => {
    uploadService.getDirectUploadToken.mockResolvedValue(null);
    const res = mockRes();
    await uploadController.getUploadToken(mockReq({ query: {} }), res);
    expect(uploadService.getDirectUploadToken).toHaveBeenCalledWith('file', '');
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('getUploadToken succeeds', async () => {
    uploadService.getDirectUploadToken.mockResolvedValue({ url: 'x', headers: {} });
    const res = mockRes();
    await uploadController.getUploadToken(mockReq({ query: { type: 'image', ext: 'jpg' } }), res);
    expect(uploadService.getDirectUploadToken).toHaveBeenCalledWith('image', 'jpg');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('registerUpload rejects missing url', async () => {
    const res = mockRes();
    await uploadController.registerUpload(mockReq({ body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('registerUpload succeeds with defaults', async () => {
    mediaAssetService.register.mockResolvedValue({ id: 55 });
    const res = mockRes();
    await uploadController.registerUpload(mockReq({ body: { url: 'u.jpg', type: 'image' } }), res);

    expect(mediaAssetService.register).toHaveBeenCalledWith({
      userId: 100001, url: 'u.jpg', fileType: 'image', bizType: 'misc', storage: 'cos'
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ assetId: 55 }) }));
  });

  it('registerUpload maps error to 400', async () => {
    mediaAssetService.register.mockRejectedValue(new Error('bad'));
    const res = mockRes();
    await uploadController.registerUpload(mockReq({ body: { url: 'u.jpg' } }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
