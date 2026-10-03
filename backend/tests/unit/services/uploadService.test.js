jest.mock('cos-nodejs-sdk-v5', () => {
  const instance = {
    putObject: jest.fn((params, cb) => cb(null, {})),
    deleteObject: jest.fn((params, cb) => cb(null, {})),
    getPresignedUrl: jest.fn((params, cb) => cb(null, { Url: 'https://signed-url' }))
  };
  const Ctor = jest.fn(() => instance);
  Ctor.__instance = instance;
  return Ctor;
});
jest.mock('../../../src/config', () => {
  const os = require('os');
  const path = require('path');
  return {
    nodeEnv: 'test',
    paths: { logs: path.join(os.tmpdir(), 'dsh-upload-logs'), uploads: 'C:/tmp/dsh-uploads', root: 'C:/app' },
    storage: {
      provider: 'local',
      cos: { secretId: null, secretKey: null, bucket: 'bucket-1', region: 'ap-guangzhou' }
    }
  };
});

const fs = require('fs');
const COS = require('cos-nodejs-sdk-v5');
const config = require('../../../src/config');
const uploadService = require('../../../src/services/uploadService');

const cosInstance = COS.__instance;
const file = (name) => ({ originalname: name, path: 'C:/tmp/upload.bin' });

describe('Service - UploadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 只替换上传相关的 fs 方法，避免影响 winston 的日志文件传输
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
    jest.spyOn(fs, 'renameSync').mockImplementation(() => {});
    jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
    jest.spyOn(fs, 'createReadStream').mockReturnValue('stream');
    config.storage.provider = 'local';
    config.storage.cos.secretId = null;
    config.storage.cos.secretKey = null;
    fs.existsSync.mockReturnValue(false);
    cosInstance.putObject.mockImplementation((params, cb) => cb(null, {}));
    cosInstance.deleteObject.mockImplementation((params, cb) => cb(null, {}));
    cosInstance.getPresignedUrl.mockImplementation((params, cb) => cb(null, { Url: 'https://signed-url' }));
  });

  describe('local uploads', () => {
    it('uploadImage validates extensions and stores locally', async () => {
      await expect(uploadService.uploadImage(file('a.txt'))).rejects.toThrow('不支持的图片格式');

      const result = await uploadService.uploadImage(file('a.PNG'));
      expect(result.url).toMatch(/^\/uploads\/images\//);
      expect(result.filename).toMatch(/\.png$/);
      expect(fs.mkdirSync).toHaveBeenCalled();
      expect(fs.renameSync).toHaveBeenCalled();
    });

    it('uploadImage skips mkdir when the folder exists', async () => {
      fs.existsSync.mockReturnValue(true);
      await uploadService.uploadImage(file('a.jpg'));
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    it('uploadAudio and uploadVideo validate and store', async () => {
      await expect(uploadService.uploadAudio(file('a.txt'))).rejects.toThrow('不支持的音频格式');
      await expect(uploadService.uploadVideo(file('a.avi'))).rejects.toThrow('不支持的视频格式');

      expect((await uploadService.uploadAudio(file('a.mp3'))).url).toMatch(/^\/uploads\/audios\//);
      expect((await uploadService.uploadVideo(file('a.mp4'))).url).toMatch(/^\/uploads\/videos\//);
    });

    it('uploadFile stores locally', async () => {
      const result = await uploadService.uploadFile(file('doc.pdf'));
      expect(result.url).toMatch(/^\/uploads\/files\//);
    });

    it('deleteFile removes local files', async () => {
      fs.existsSync.mockReturnValue(true);
      await expect(uploadService.deleteFile('/uploads/a.png')).resolves.toBe(true);

      fs.existsSync.mockReturnValue(false);
      await expect(uploadService.deleteFile('/uploads/a.png')).resolves.toBe(false);
    });

    it('getDirectUploadToken returns null when COS is not configured', async () => {
      await expect(uploadService.getDirectUploadToken('image', 'png')).resolves.toBe(null);
    });
  });

  describe('cos integration', () => {
    beforeEach(() => {
      config.storage.provider = 'cos';
      config.storage.cos.secretId = 'id';
      config.storage.cos.secretKey = 'key';
    });

    it('uploads images to COS', async () => {
      const result = await uploadService.uploadImage(file('a.jpg'));
      expect(COS).toHaveBeenCalled();
      expect(result.url).toContain('bucket-1.cos.ap-guangzhou.myqcloud.com/images/');
      expect(fs.unlinkSync).toHaveBeenCalled();
      expect(cosInstance.putObject.mock.calls[0][0].ContentType).toBe('image/jpeg');
    });

    it('rejects when COS fails (关闭降级时)', async () => {
      const prev = config.storage.fallback;
      config.storage.fallback = false;
      cosInstance.putObject.mockImplementation((params, cb) => cb(new Error('nope')));
      try {
        await expect(uploadService.uploadImage(file('a.png'))).rejects.toThrow('COS上传失败');
      } finally {
        config.storage.fallback = prev;
      }
    });

    it('uploads generic files to COS', async () => {
      const result = await uploadService.uploadFile(file('a.zip'));
      expect(result.url).toContain('/files/');
      expect(cosInstance.putObject.mock.calls[0][0].ContentType).toBe('application/octet-stream');
    });

    it('deletes COS objects by key', async () => {
      await expect(uploadService.deleteFile('/images/a.png')).resolves.toBe(true);
      expect(cosInstance.deleteObject.mock.calls[0][0].Key).toBe('images/a.png');

      cosInstance.deleteObject.mockImplementation((params, cb) => cb(new Error('boom')));
      await expect(uploadService.deleteFile('images/a.png')).resolves.toBe(false);
    });

    it('isCosUrl detects COS urls', () => {
      expect(uploadService.isCosUrl(null)).toBe(false);
      expect(uploadService.isCosUrl('/uploads/a.png')).toBe(false);
      expect(uploadService.isCosUrl('https://b.cos.r.myqcloud.com/a.png')).toBe(true);
    });

    it('deleteByUrl handles COS and local urls', async () => {
      await expect(uploadService.deleteByUrl('')).resolves.toBe(false);

      const cosUrl = 'https://bucket-1.cos.ap-guangzhou.myqcloud.com/images/a.png';
      await expect(uploadService.deleteByUrl(cosUrl)).resolves.toBe(true);
      expect(cosInstance.deleteObject.mock.calls[0][0].Key).toBe('images/a.png');

      // 非标准前缀的 COS url 使用原字符串作为 key
      await uploadService.deleteByUrl('https://other.cos.x.myqcloud.com/a.png');
      expect(cosInstance.deleteObject.mock.calls[1][0].Key).toBe('https://other.cos.x.myqcloud.com/a.png');

      fs.existsSync.mockReturnValue(true);
      await expect(uploadService.deleteByUrl('/uploads/a.png')).resolves.toBe(true);

      fs.existsSync.mockReturnValue(false);
      await expect(uploadService.deleteByUrl('/uploads/a.png')).resolves.toBe(false);
    });

    it('getDirectUploadToken issues presigned urls', async () => {
      const token = await uploadService.getDirectUploadToken('image', 'png');
      expect(token.url).toBe('https://signed-url');
      expect(token.key).toContain('uploads/images/');
      expect(token.accessUrl).toContain('bucket-1.cos.ap-guangzhou.myqcloud.com');

      const noDot = await uploadService.getDirectUploadToken('audio', 'mp3');
      expect(noDot.key).toMatch(/\.mp3$/);

      await expect(uploadService.getDirectUploadToken('image', 'exe')).rejects.toThrow('不支持的文件格式');
      await expect(uploadService.getDirectUploadToken('file', 'zip!')).rejects.toThrow('不支持的文件格式');

      const generic = await uploadService.getDirectUploadToken('unknown', '');
      expect(generic.key).toContain('uploads/files/');
    });

    it('getDirectUploadToken rejects when presigning fails', async () => {
      cosInstance.getPresignedUrl.mockImplementation((params, cb) => cb(new Error('sign fail')));
      await expect(uploadService.getDirectUploadToken('image', 'png')).rejects.toThrow('sign fail');
    });
  });
});
