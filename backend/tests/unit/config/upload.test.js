jest.mock('multer', () => {
  const multer = jest.fn((opts) => ({ opts, single: jest.fn(), array: jest.fn() }));
  multer.diskStorage = jest.fn((o) => o);
  return multer;
});
jest.mock('../../../src/config', () => ({ paths: { uploads: 'C:/tmp/dsh-uploads' } }));

const multer = require('multer');
const upload = require('../../../src/config/upload');

// setup.js 的 afterEach 会 clearAllMocks，因此在模块加载后立即快照调用参数
const multerCalls = multer.mock.calls.slice();
const opts = multerCalls[0][0];

describe('Config - Upload', () => {
  it('creates a multer instance with filter and limits', () => {
    expect(multerCalls.length).toBe(1);
    expect(typeof opts.fileFilter).toBe('function');
    // 审计 I-25：全局上限放宽到 100MB（视频），各类型限额在 uploadService 中二次校验
    expect(opts.limits.fileSize).toBe(100 * 1024 * 1024);
    expect(upload).toBeDefined();
  });

  it('resolves the upload destination', () => {
    const cb = jest.fn();
    opts.storage.destination({}, {}, cb);
    expect(cb).toHaveBeenCalledWith(null, 'C:/tmp/dsh-uploads');
  });

  it('generates a filename preserving the extension', () => {
    const cb = jest.fn();
    opts.storage.filename({}, { originalname: 'photo.PNG' }, cb);
    expect(cb).toHaveBeenCalledWith(null, expect.stringMatching(/\.PNG$/));
  });

  it('allows supported mime types', () => {
    const cb = jest.fn();
    opts.fileFilter({}, { mimetype: 'image/png' }, cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it('rejects unsupported mime types', () => {
    const cb = jest.fn();
    opts.fileFilter({}, { mimetype: 'application/x-msdownload' }, cb);
    expect(cb).toHaveBeenCalledWith(expect.any(Error), false);
  });
});
