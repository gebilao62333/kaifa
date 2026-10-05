const albumController = require('../../../src/controllers/album');

jest.mock('../../../src/services', () => ({
  cosSignedUrlService: {
    getSignedAccessUrl: jest.fn(url => Promise.resolve('signed:' + url)),
    resolveUrls: jest.fn(urls => Promise.resolve(urls || []))
  },
  levelService: { canUse: jest.fn() }
}));

jest.mock('../../../src/services/albumService', () => ({
  getPhotos: jest.fn(),
  uploadPhoto: jest.fn(),
  deletePhoto: jest.fn(),
  likePhoto: jest.fn()
}));

jest.mock('../../../src/models', () => ({
  AlbumPhoto: { count: jest.fn() }
}));

const { cosSignedUrlService, levelService } = require('../../../src/services');
const albumService = require('../../../src/services/albumService');
const { AlbumPhoto } = require('../../../src/models');

const mockReq = (overrides = {}) => ({ userId: 100001, body: {}, query: {}, params: {}, ...overrides });
const mockRes = () => {
  const res = {};
  res.setHeader = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Controller - Album', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 相册额度：默认按已扩容处理，让非额度用例聚焦各自断言
    levelService.canUse.mockResolvedValue(true);
    AlbumPhoto.count.mockResolvedValue(0);
  });

  describe('getPhotos', () => {
    it('signs each photo url and thumbnail', async () => {
      albumService.getPhotos.mockResolvedValue({
        list: [
          { id: 1, url: 'a.jpg', thumbnail: 'a_t.jpg' },
          { id: 2, url: 'b.jpg' }
        ],
        total: 2
      });
      const req = mockReq({ query: { page: '1', pageSize: '12' } });
      const res = mockRes();

      await albumController.getPhotos(req, res);

      expect(albumService.getPhotos).toHaveBeenCalledWith(100001, 1, 12);
      expect(cosSignedUrlService.getSignedAccessUrl).toHaveBeenCalledWith('a.jpg');
      expect(cosSignedUrlService.getSignedAccessUrl).toHaveBeenCalledWith('a_t.jpg');
      expect(res.status).toHaveBeenCalledWith(200);
      const payload = res.json.mock.calls[0][0];
      expect(payload.data.list[0].url).toBe('signed:a.jpg');
    });

    it('handles result without list', async () => {
      albumService.getPhotos.mockResolvedValue([{ id: 1 }]);
      const req = mockReq();
      const res = mockRes();

      await albumController.getPhotos(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 500 on service error', async () => {
      albumService.getPhotos.mockRejectedValue(new Error('db fail'));
      const req = mockReq();
      const res = mockRes();

      await albumController.getPhotos(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('uploadPhoto', () => {
    it('rejects missing url', async () => {
      const req = mockReq({ body: {} });
      const res = mockRes();

      await albumController.uploadPhoto(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('uploads successfully', async () => {
      albumService.uploadPhoto.mockResolvedValue({ id: 9 });
      const req = mockReq({ body: { url: 'x.jpg', description: 'd', privacy: 0, password: '', price: 0 } });
      const res = mockRes();

      await albumController.uploadPhoto(req, res);

      expect(albumService.uploadPhoto).toHaveBeenCalledWith(100001, 'x.jpg', 'd', 0, '', 0);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: '上传成功' }));
    });

    it('maps error to 400', async () => {
      albumService.uploadPhoto.mockRejectedValue(new Error('bad'));
      const req = mockReq({ body: { url: 'x.jpg' } });
      const res = mockRes();

      await albumController.uploadPhoto(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('caps the album at 20 photos below Lv.25', async () => {
      levelService.canUse.mockResolvedValue(false);
      AlbumPhoto.count.mockResolvedValue(20);
      const req = mockReq({ body: { url: 'x.jpg' } });
      const res = mockRes();

      await albumController.uploadPhoto(req, res);

      expect(albumService.uploadPhoto).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json.mock.calls[0][0].message).toContain('Lv.25 可扩容至 50 张');
    });

    it('allows up to 50 photos once Lv.25 is reached', async () => {
      levelService.canUse.mockResolvedValue(true);
      AlbumPhoto.count.mockResolvedValue(49);
      albumService.uploadPhoto.mockResolvedValue({ id: 10 });
      const req = mockReq({ body: { url: 'y.jpg' } });
      const res = mockRes();

      await albumController.uploadPhoto(req, res);

      expect(albumService.uploadPhoto).toHaveBeenCalledWith(100001, 'y.jpg', undefined, undefined, undefined, undefined);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deletePhoto', () => {
    it('rejects missing id', async () => {
      const req = mockReq({ body: {} });
      const res = mockRes();

      await albumController.deletePhoto(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('deletes successfully', async () => {
      albumService.deletePhoto.mockResolvedValue(true);
      const req = mockReq({ body: { id: '5' } });
      const res = mockRes();

      await albumController.deletePhoto(req, res);

      expect(albumService.deletePhoto).toHaveBeenCalledWith(100001, 5);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('maps error to 422', async () => {
      albumService.deletePhoto.mockRejectedValue(new Error('not found'));
      const req = mockReq({ body: { id: 5 } });
      const res = mockRes();

      await albumController.deletePhoto(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
    });
  });

  describe('likePhoto', () => {
    it('rejects missing id', async () => {
      const req = mockReq({ body: {} });
      const res = mockRes();

      await albumController.likePhoto(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('likes successfully', async () => {
      albumService.likePhoto.mockResolvedValue({ isLiked: true });
      const req = mockReq({ body: { id: 3 } });
      const res = mockRes();

      await albumController.likePhoto(req, res);

      expect(albumService.likePhoto).toHaveBeenCalledWith(100001, 3);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('maps error to 422', async () => {
      albumService.likePhoto.mockRejectedValue(new Error('bad'));
      const req = mockReq({ body: { id: 3 } });
      const res = mockRes();

      await albumController.likePhoto(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
    });
  });
});
