const path = require('path');
const fs = require('fs');
const config = require('../../../src/config');

// 回归背景：config.paths.uploads 曾指向 backend/src/public/uploads（不存在），
// 导致 multer 直接 ENOENT → 上传接口 500；同时 deleteFile 也按该错误根目录找文件 → 本地文件永远删不掉。
describe('Config - 文件路径', () => {
  const backendRoot = path.resolve(__dirname, '../../..');

  it('uploads 必须指向 backend/public/uploads', () => {
    expect(config.paths.uploads).toBe(path.join(backendRoot, 'public', 'uploads'));
  });

  it('public 必须指向 backend/public', () => {
    expect(config.paths.public).toBe(path.join(backendRoot, 'public'));
  });

  it('上传目录不能落在 src 源码目录内', () => {
    expect(config.paths.uploads.startsWith(path.join(backendRoot, 'src'))).toBe(false);
  });

  it('上传目录真实存在（否则首次上传会 500）', () => {
    expect(fs.existsSync(config.paths.uploads)).toBe(true);
  });
});
